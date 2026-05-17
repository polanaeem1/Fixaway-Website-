import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const getMyOrders = async (req: any, res: Response) => {
  const { page = 1, limit = 10, status } = req.query;
  const where: any = {};
  if (req.user.role === 'CUSTOMER') where.customerId = req.user.userId;
  if (req.user.role === 'TECHNICIAN') where.technicianId = req.user.userId;
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        request: { include: { category: true } },
        customer: { select: { id: true, name: true, avatarUrl: true, phone: true } },
        technician: { select: { id: true, name: true, avatarUrl: true, phone: true, technicianProfile: true } },
        quotation: true,
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return sendSuccess(res, { orders, total });
};

export const getOrderById = async (req: any, res: Response) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      request: { include: { category: true } },
      customer: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      technician: { select: { id: true, name: true, avatarUrl: true, phone: true, technicianProfile: true } },
      quotation: true,
      messages: { include: { sender: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
      reviews: true,
    },
  });
  if (!order) return sendError(res, 'Order not found', 404);
  return sendSuccess(res, order);
};

export const updateOrderStatus = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['CONFIRMED', 'TECHNICIAN_EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) return sendError(res, 'Invalid status');

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return sendError(res, 'Order not found', 404);

  const data: any = { status };
  if (status === 'IN_PROGRESS') data.startedAt = new Date();
  if (status === 'COMPLETED') {
    data.completedAt = new Date();
    // Update request status
    await prisma.serviceRequest.update({ where: { id: order.requestId }, data: { status: 'COMPLETED' } });
    // Add earnings to technician wallet
    await prisma.technicianProfile.update({
      where: { userId: order.technicianId },
      data: { walletBalance: { increment: order.totalAmount * 0.85 }, totalJobs: { increment: 1 } },
    });
    await prisma.walletTransaction.create({
      data: {
        userId: order.technicianId,
        orderId: id,
        type: 'CREDIT',
        amount: order.totalAmount * 0.85,
        description: `Earnings from order #${id.slice(-6)}`,
      },
    });
    // Debit customer wallet
    await prisma.walletTransaction.create({
      data: {
        userId: order.customerId,
        orderId: id,
        type: 'DEBIT',
        amount: order.totalAmount,
        description: `Payment for order #${id.slice(-6)}`,
      },
    });
  }

  const updated = await prisma.order.update({ where: { id }, data });
  return sendSuccess(res, updated, 'Order status updated');
};

export const getAllOrders = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status } = req.query;
  const where: any = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        request: { include: { category: true } },
        customer: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return sendSuccess(res, { orders, total });
};
