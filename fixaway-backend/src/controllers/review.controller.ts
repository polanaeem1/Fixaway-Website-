import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/response';

export const submitReview = async (req: any, res: Response) => {
  const { orderId, rating, comment } = req.body;

  if (!orderId || !rating) return sendError(res, 'orderId and rating are required');
  if (rating < 1 || rating > 5) return sendError(res, 'Rating must be between 1 and 5');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { reviews: true },
  });

  if (!order) return sendError(res, 'Order not found', 404);
  if (order.status !== 'COMPLETED') return sendError(res, 'Can only review completed orders');
  if (order.customerId !== req.user.userId) return sendError(res, 'Unauthorized', 403);

  const alreadyReviewed = order.reviews.some(r => r.raterId === req.user.userId);
  if (alreadyReviewed) return sendError(res, 'You have already reviewed this order');

  const review = await prisma.review.create({
    data: {
      orderId,
      raterId: req.user.userId,
      ratedId: order.technicianId,
      rating: Number(rating),
      comment,
    },
  });

  // Recalculate technician average rating
  const allReviews = await prisma.review.findMany({
    where: { ratedId: order.technicianId },
    select: { rating: true },
  });
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  await prisma.technicianProfile.update({
    where: { userId: order.technicianId },
    data: { rating: Math.round(avg * 10) / 10 },
  });

  return sendCreated(res, review, 'Review submitted');
};
