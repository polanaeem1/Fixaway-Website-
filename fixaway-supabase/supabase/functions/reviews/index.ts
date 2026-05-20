import { handleCors } from '../_shared/cors.ts';
import { adminDb, created, err, genId } from '../_shared/db.ts';
import { requireAuth } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return err('Method not allowed', 405);

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  const { orderId, rating, comment } = await req.json();
  if (!orderId || !rating) return err('orderId and rating are required');
  if (rating < 1 || rating > 5) return err('Rating must be between 1 and 5');

  const { data: order } = await adminDb.from('orders')
    .select('id, status, customerId, technicianId, reviews(*)')
    .eq('id', orderId).maybeSingle();

  if (!order) return err('Order not found', 404);
  if (order.status !== 'COMPLETED') return err('Can only review completed orders');
  if (order.customerId !== authResult.userId) return err('Unauthorized', 403);

  const alreadyReviewed = (order.reviews ?? []).some((r: any) => r.raterId === authResult.userId);
  if (alreadyReviewed) return err('You have already reviewed this order');

  const { data: review, error: revErr } = await adminDb.from('reviews').insert({
    id: genId(),
    orderId: orderId,
    raterId: authResult.userId,
    ratedId: order.technicianId,
    rating: Number(rating),
    comment: comment ?? null,
  }).select().single();

  if (revErr) return err(`Failed to submit review: ${revErr.message}`, 500);

  // Recalculate technician average rating
  const { data: allReviews } = await adminDb.from('reviews')
    .select('rating').eq('ratedId', order.technicianId);

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length;
    await adminDb.from('technician_profiles')
      .update({ rating: Math.round(avg * 10) / 10, updatedAt: new Date().toISOString() })
      .eq('userId', order.technicianId);
  }

  return created(review, 'Review submitted');
});
