import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

export const getWallet = async (req: any, res: Response) => {
  if (req.user.role === 'TECHNICIAN') {
    const profile = await prisma.technicianProfile.findUnique({ where: { userId: req.user.userId } });
    return sendSuccess(res, { balance: profile?.walletBalance || 0 });
  }
  // For customers: sum credits and debits from wallet transactions
  const transactions = await prisma.walletTransaction.findMany({ where: { userId: req.user.userId } });
  const balance = transactions.reduce((acc, t) => {
    return t.type === 'CREDIT' ? acc + t.amount : acc - t.amount;
  }, 0);
  return sendSuccess(res, { balance });
};

export const getTransactions = async (req: any, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId: req.user.userId },
      include: { order: { select: { id: true } } },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.walletTransaction.count({ where: { userId: req.user.userId } }),
  ]);
  return sendSuccess(res, { transactions, total });
};

export const getEarnings = async (req: any, res: Response) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const transactions = await prisma.walletTransaction.findMany({
    where: {
      userId: req.user.userId,
      type: 'CREDIT',
      createdAt: { gte: sevenDaysAgo },
    },
    select: { amount: true, createdAt: true },
  });

  // Aggregate by day (0 to 6)
  const dailyTotals = Array(7).fill(0);
  let todayTotal = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  transactions.forEach((tx) => {
    const txDate = new Date(tx.createdAt);
    txDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - txDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays < 7) {
      // Index 6 is today, 0 is 6 days ago
      const index = 6 - diffDays;
      dailyTotals[index] += tx.amount;
    }
    
    if (diffDays === 0) todayTotal += tx.amount;
  });

  return sendSuccess(res, { 
    dailyTotals, 
    todayTotal,
    // Provide percentage heights for the UI bars (maxing at largest day)
    barHeights: (() => {
      const max = Math.max(...dailyTotals, 1);
      return dailyTotals.map(total => `${Math.max(10, Math.round((total / max) * 100))}%`);
    })()
  });
};

export const addFunds = async (req: any, res: Response) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return sendError(res, 'Valid amount is required');

  // MVP: mock payment — just create a credit transaction
  const transaction = await prisma.walletTransaction.create({
    data: {
      userId: req.user.userId,
      type: 'CREDIT',
      amount: Number(amount),
      description: 'Wallet top-up',
    },
  });
  return sendSuccess(res, transaction, `EGP ${amount} added successfully`);
};

export const submitReview = async (req: any, res: Response) => {
  const { orderId, rating, comment } = req.body;
  if (!orderId || !rating) return sendError(res, 'orderId and rating are required');
  if (rating < 1 || rating > 5) return sendError(res, 'Rating must be between 1 and 5');

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return sendError(res, 'Order not found', 404);
  if (order.status !== 'COMPLETED') return sendError(res, 'Can only review completed orders');

  const ratedId =
    req.user.userId === order.customerId ? order.technicianId : order.customerId;

  const existing = await prisma.review.findFirst({ where: { orderId, raterId: req.user.userId } });
  if (existing) return sendError(res, 'You already reviewed this order');

  const review = await prisma.review.create({
    data: { orderId, raterId: req.user.userId, ratedId, rating: Number(rating), comment },
  });

  // Update technician average rating
  if (req.user.userId === order.customerId) {
    const reviews = await prisma.review.findMany({ where: { ratedId: order.technicianId } });
    const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    await prisma.technicianProfile.update({
      where: { userId: order.technicianId },
      data: { rating: Math.round(avg * 10) / 10 },
    });
  }

  return sendSuccess(res, review, 'Review submitted');
};

export const getNotifications = async (req: any, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return sendSuccess(res, notifications);
};

export const markNotificationRead = async (req: any, res: Response) => {
  const { id } = req.params;
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return sendSuccess(res, null, 'Marked as read');
};
