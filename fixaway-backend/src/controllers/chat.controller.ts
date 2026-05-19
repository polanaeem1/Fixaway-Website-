import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/response';

export const getMessages = async (req: any, res: Response) => {
  const { orderId } = req.params;
  const messages = await prisma.chatMessage.findMany({
    where: { orderId },
    include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return sendSuccess(res, messages);
};

export const sendMessage = async (req: any, res: Response) => {
  const { orderId } = req.params;
  const { content, mediaUrl } = req.body;

  if (!content && !mediaUrl) return sendError(res, 'Message content or media is required');

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return sendError(res, 'Order not found', 404);

  const isParticipant = order.customerId === req.user.userId || order.technicianId === req.user.userId;
  if (!isParticipant) return sendError(res, 'Not a participant in this order', 403);

  const message = await prisma.chatMessage.create({
    data: { orderId, senderId: req.user.userId, content: content || '', mediaUrl },
    include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`order:${orderId}`).emit('message_received', message);
  }

  return sendCreated(res, message);
};

export const reportChat = async (req: any, res: Response) => {
  const { orderId } = req.params;
  const { reason, messageId } = req.body;

  if (!reason) return sendError(res, 'Reason is required');

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return sendError(res, 'Order not found', 404);

  const reportedUserId = req.user.userId === order.customerId ? order.technicianId : order.customerId;

  let finalDescription = `Reported by user (ID: ${req.user.userId}): ${reason}`;
  if (messageId) {
    const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (msg) {
      finalDescription += `\nFlagged Message: "${msg.content}" ${msg.mediaUrl ? `[Media: ${msg.mediaUrl}]` : ''}`;
    }
  }

  const alert = await prisma.fraudAlert.create({
    data: {
      orderId,
      type: 'SUSPICIOUS_ACTIVITY',
      description: finalDescription,
    },
  });

  return sendCreated(res, alert, 'Report submitted successfully to the admin');
};
