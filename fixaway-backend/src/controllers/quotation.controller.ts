import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/response';

export const submitQuotation = async (req: any, res: Response) => {
  const { requestId, price, note, eta } = req.body;
  if (!requestId || !price) return sendError(res, 'requestId and price are required');

  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request) return sendError(res, 'Request not found', 404);
  if (request.status !== 'PENDING') return sendError(res, 'Request is no longer accepting quotes');

  const existing = await prisma.quotation.findFirst({
    where: { requestId, technicianId: req.user.userId },
  });
  if (existing) return sendError(res, 'You already submitted a quotation for this request');

  const quotation = await prisma.quotation.create({
    data: { requestId, technicianId: req.user.userId, price: Number(price), note, eta },
    include: { technician: { select: { id: true, name: true, avatarUrl: true, technicianProfile: true } } },
  });

  await prisma.serviceRequest.update({ where: { id: requestId }, data: { status: 'QUOTED' } });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${request.customerId}`).emit('new_quotation', quotation);
  }

  return sendCreated(res, quotation, 'Quotation submitted');
};

export const acceptQuotation = async (req: any, res: Response) => {
  const { id } = req.params;
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { request: true },
  });
  if (!quotation) return sendError(res, 'Quotation not found', 404);
  if (quotation.request.customerId !== req.user.userId) return sendError(res, 'Unauthorized', 403);

  if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(quotation.request.status)) {
    return sendError(res, 'An order has already been created for this request', 400);
  }

  // Reject all other quotations for this request
  await prisma.quotation.updateMany({
    where: { requestId: quotation.requestId, id: { not: id } },
    data: { status: 'REJECTED' },
  });

  const updated = await prisma.quotation.update({ where: { id }, data: { status: 'ACCEPTED' } });

  // Create order
  const order = await prisma.order.create({
    data: {
      requestId: quotation.requestId,
      quotationId: id,
      customerId: req.user.userId,
      technicianId: quotation.technicianId,
      totalAmount: quotation.price,
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      technician: { select: { id: true, name: true, phone: true } },
    },
  });

  await prisma.serviceRequest.update({ where: { id: quotation.requestId }, data: { status: 'ACCEPTED' } });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${quotation.technicianId}`).emit('quotation_accepted', order);
  }

  return sendSuccess(res, { quotation: updated, order }, 'Quotation accepted, order created');
};

export const rejectQuotation = async (req: any, res: Response) => {
  const { id } = req.params;
  const quotation = await prisma.quotation.findUnique({ where: { id }, include: { request: true } });
  if (!quotation) return sendError(res, 'Quotation not found', 404);
  if (quotation.request.customerId !== req.user.userId) return sendError(res, 'Unauthorized', 403);

  await prisma.quotation.update({ where: { id }, data: { status: 'REJECTED' } });
  return sendSuccess(res, null, 'Quotation rejected');
};
