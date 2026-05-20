import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, err, getPathSegments, getQuery, genId } from '../_shared/db.ts';
import { requireAuth, requireRole } from '../_shared/auth.ts';

function mapOrderRelations(order: any) {
  if (!order) return;
  if (order.serviceRequest) {
    order.request = {
      ...order.serviceRequest,
      category: Array.isArray(order.serviceRequest.categories)
        ? (order.serviceRequest.categories[0] || null)
        : (order.serviceRequest.categories || null),
    };
  }
  if (order.technician && order.technician.technician_profiles) {
    order.technician.technicianProfile = order.technician.technician_profiles[0] || null;
    delete order.technician.technician_profiles;
  }
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;
  const q = getQuery(req);

  // GET /orders/all  (admin)
  if (method === 'GET' && segments.at(-1) === 'all') {
    const authResult = await requireRole(req, 'ADMIN');
    if (authResult instanceof Response) return authResult;

    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 20);
    const status = q.get('status');

    let query = adminDb.from('orders').select(`
      *,
      serviceRequest:service_requests!requestId(*, categories(*)),
      customer:users!customerId(id, name, email),
      technician:users!technicianId(id, name, email)
    `, { count: 'exact' });
    if (status) query = query.eq('status', status);

    const { data, count } = await query
      .order('createdAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (data) {
      data.forEach(mapOrderRelations);
    }

    return ok({ orders: data ?? [], total: count ?? 0 });
  }

  // PATCH /orders/:id/status
  if (method === 'PATCH' && segments.at(-1) === 'status') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const id = segments[segments.length - 2];
    const { status } = await req.json();
    const validStatuses = ['CONFIRMED', 'TECHNICIAN_EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) return err('Invalid status');

    const { data: order } = await adminDb.from('orders')
      .select('id, customerId, technicianId, requestId, totalAmount, status')
      .eq('id', id).maybeSingle();
    if (!order) return err('Order not found', 404);

    const updateData: Record<string, unknown> = { status, updatedAt: new Date().toISOString() };
    if (status === 'IN_PROGRESS') updateData.startedAt = new Date().toISOString();

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date().toISOString();

      // Update request status
      await adminDb.from('service_requests').update({ status: 'COMPLETED', updatedAt: new Date().toISOString() }).eq('id', order.requestId);

      const techEarnings = order.totalAmount * 0.85;

      // Direct update approach:
      const { data: techProfile } = await adminDb.from('technician_profiles')
        .select('walletBalance, totalJobs').eq('userId', order.technicianId).maybeSingle();

      if (techProfile) {
        await adminDb.from('technician_profiles').update({
          walletBalance: (techProfile.walletBalance ?? 0) + techEarnings,
          totalJobs: (techProfile.totalJobs ?? 0) + 1,
        }).eq('userId', order.technicianId);
      }

      // Create wallet transactions
      await adminDb.from('wallet_transactions').insert([
        {
          id: genId(),
          userId: order.technicianId,
          orderId: id,
          type: 'CREDIT',
          amount: techEarnings,
          description: `Earnings from order #${id.slice(-6)}`,
        },
        {
          id: genId(),
          userId: order.customerId,
          orderId: id,
          type: 'DEBIT',
          amount: order.totalAmount,
          description: `Payment for order #${id.slice(-6)}`,
        },
      ]);
    }

    const { data: updated } = await adminDb.from('orders').update(updateData).eq('id', id).select().single();
    return ok(updated, 'Order status updated');
  }

  // GET /orders/:id  (single with full details)
  if (method === 'GET' && segments.length >= 1 && segments.at(-1) !== 'orders') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const id = segments.at(-1)!;
    const { data } = await adminDb.from('orders').select(`
      *,
      serviceRequest:service_requests!requestId(*, categories(*)),
      customer:users!customerId(id, name, avatarUrl, phone),
      technician:users!technicianId(id, name, avatarUrl, phone, technician_profiles(*)),
      quotation:quotations(*),
      chatMessages:chat_messages(*, sender:users!senderId(id, name, avatarUrl, role)),
      reviews(*)
    `).eq('id', id).maybeSingle();

    if (!data) return err('Order not found', 404);

    mapOrderRelations(data);

    return ok(data);
  }

  // GET /orders  – my orders (customer or technician)
  if (method === 'GET') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 10);
    const status = q.get('status');

    let query = adminDb.from('orders').select(`
      *,
      serviceRequest:service_requests!requestId(*, categories(*)),
      customer:users!customerId(id, name, avatarUrl, phone),
      technician:users!technicianId(id, name, avatarUrl, phone, technician_profiles(*)),
      quotation:quotations(*)
    `, { count: 'exact' });

    if (authResult.role === 'CUSTOMER') query = query.eq('customerId', authResult.userId);
    if (authResult.role === 'TECHNICIAN') query = query.eq('technicianId', authResult.userId);
    if (status) query = query.eq('status', status);

    const { data, count } = await query
      .order('createdAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (data) {
      data.forEach(mapOrderRelations);
    }

    return ok({ orders: data ?? [], total: count ?? 0 });
  }

  return err('Not found', 404);
});
