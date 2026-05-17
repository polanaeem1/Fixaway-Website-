import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const getMyNotifications = async (req: any, res: Response) => {
  const { page = 1, limit = 20 } = req.query;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.notification.count({ where: { userId: req.user.userId } }),
    prisma.notification.count({ where: { userId: req.user.userId, isRead: false } }),
  ]);

  return sendSuccess(res, { notifications, total, unreadCount });
};

export const markAllRead = async (req: any, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.userId, isRead: false },
    data: { isRead: true },
  });
  return sendSuccess(res, null, 'All notifications marked as read');
};

export const markOneRead = async (req: any, res: Response) => {
  const { id } = req.params;
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) return sendError(res, 'Notification not found', 404);
  if (notif.userId !== req.user.userId) return sendError(res, 'Unauthorized', 403);

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return sendSuccess(res, null, 'Marked as read');
};
