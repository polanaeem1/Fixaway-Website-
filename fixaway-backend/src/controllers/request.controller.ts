import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/response';

export const createRequest = async (req: any, res: Response) => {
  const { categoryId, type, title, description, mediaUrls, lat, lng, address } = req.body;

  if (!title || !description) {
    return sendError(res, 'Title and description are required');
  }

  const request = await prisma.serviceRequest.create({
    data: {
      customerId: req.user.userId,
      categoryId,
      type: type || 'HOME',
      title,
      description,
      mediaUrls: mediaUrls || [],
      lat,
      lng,
      address,
    },
    include: { category: true, customer: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const io = req.app.get('io');
  if (io) {
    io.to('role:TECHNICIAN').emit('new_request', request);
  }

  return sendCreated(res, request, 'Service request created');
};

export const getMyRequests = async (req: any, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query;
  const where: any = { customerId: req.user.userId };
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        category: true,
        quotations: { include: { technician: { select: { id: true, name: true, avatarUrl: true } } } },
        order: { include: { reviews: true, technician: { select: { id: true, name: true } } } },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return sendSuccess(res, { requests, total });
};

export const getNearbyRequests = async (req: any, res: Response) => {
  // For technicians - get open requests near their location
  const { lat, lng, radius = 15 } = req.query;

  const requests = await prisma.serviceRequest.findMany({
    where: { status: 'PENDING' },
    include: { category: true, customer: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return sendSuccess(res, requests);
};

export const getRequestById = async (req: any, res: Response) => {
  const { id } = req.params;
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      category: true,
      customer: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      quotations: {
        include: { technician: { select: { id: true, name: true, avatarUrl: true, technicianProfile: true } } },
      },
      order: true,
    },
  });
  if (!request) return sendError(res, 'Request not found', 404);
  return sendSuccess(res, request);
};

export const cancelRequest = async (req: any, res: Response) => {
  const { id } = req.params;
  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) return sendError(res, 'Request not found', 404);
  if (request.customerId !== req.user.userId) return sendError(res, 'Unauthorized', 403);
  if (['IN_PROGRESS', 'COMPLETED'].includes(request.status)) {
    return sendError(res, 'Cannot cancel this request');
  }
  const updated = await prisma.serviceRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
  return sendSuccess(res, updated, 'Request cancelled');
};

export const getAllRequests = async (req: Request, res: Response) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where: any = {};
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        category: true,
        customer: { select: { id: true, name: true, email: true } },
        order: true,
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return sendSuccess(res, { requests, total });
};
