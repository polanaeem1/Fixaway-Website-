import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess } from '../utils/response';

export const getStats = async (req: Request, res: Response) => {
  const [
    totalOrders,
    activeTechnicians,
    pendingVerifications,
    fraudAlerts,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.technicianProfile.count({ where: { isOnline: true } }),
    prisma.technicianProfile.count({ where: { isVerified: false } }),
    prisma.fraudAlert.count({ where: { resolvedAt: null } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
        request: { include: { category: true } },
      },
    }),
  ]);

  // Revenue: sum all completed order amounts (platform takes 15%)
  const completedOrders = await prisma.order.findMany({ where: { status: 'COMPLETED' } });
  const totalRevenue = completedOrders.reduce((a, o) => a + o.totalAmount * 0.15, 0);

  return sendSuccess(res, {
    totalOrders,
    activeTechnicians,
    pendingVerifications,
    fraudAlerts,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    recentOrders,
  });
};

export const getUsers = async (req: Request, res: Response) => {
  const { role, page = 1, limit = 20 } = req.query;
  const where: any = {};
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, technicianProfile: true },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return sendSuccess(res, { users, total });
};

export const getFraudAlerts = async (req: Request, res: Response) => {
  const alerts = await prisma.fraudAlert.findMany({
    where: { resolvedAt: null },
    include: { order: { include: { customer: { select: { name: true } }, technician: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, alerts);
};

export const resolveFraudAlert = async (req: Request, res: Response) => {
  const { id } = req.params;
  const alert = await prisma.fraudAlert.update({ where: { id: id as string }, data: { resolvedAt: new Date() } });
  return sendSuccess(res, alert, 'Alert resolved');
};

export const toggleUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id: id as string } });
  if (!user) return sendSuccess(res, null);
  const updated = await prisma.user.update({ where: { id: id as string }, data: { isActive: !user.isActive } });
  return sendSuccess(res, { isActive: updated.isActive });
};
