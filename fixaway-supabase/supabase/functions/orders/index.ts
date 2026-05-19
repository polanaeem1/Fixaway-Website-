import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, err, getPathSegments, getQuery, genId } from '../_shared/db.ts';
import { requireAuth, requireRole } from '../_shared/auth.ts';

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
      service_requests!request_id(*, categories(*)),
      users!customer_id(id, name, email),
      users!technician_id(id, name, email)
    `, { count: 'exact' });
    if (status) query = query.eq('status', status);

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

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
      .select('id, customer_id, technician_id, request_id, total_amount, status')
      .eq('id', id).maybeSingle();
    if (!order) return err('Order not found', 404);

    const updateData: Record<string, unknown> = { status };
    if (status === 'IN_PROGRESS') updateData.started_at = new Date().toISOString();

    if (status === 'COMPLETED') {
      updateData.completed_at = new Date().toISOString();

      // Update request status
      await adminDb.from('service_requests').update({ status: 'COMPLETED' }).eq('id', order.request_id);

      const techEarnings = order.total_amount * 0.85;

      // Credit technician wallet balance
      await adminDb.from('technician_profiles')
        .update({
          wallet_balance: adminDb.rpc('increment_wallet', {
            tech_id: order.technician_id,
            amount: techEarnings,
          }),
          total_jobs: adminDb.rpc('increment_jobs', { tech_id: order.technician_id }),
        })
        .eq('user_id', order.technician_id);

      // Simpler approach: raw RPC or direct update
      const { data: techProfile } = await adminDb.from('technician_profiles')
        .select('wallet_balance, total_jobs').eq('user_id', order.technician_id).single();

      if (techProfile) {
        await adminDb.from('technician_profiles').update({
          wallet_balance: (techProfile.wallet_balance ?? 0) + techEarnings,
          total_jobs: (techProfile.total_jobs ?? 0) + 1,
        }).eq('user_id', order.technician_id);
      }

      // Create wallet transactions
      await adminDb.from('wallet_transactions').insert([
        {
          id: genId(),
          user_id: order.technician_id,
          order_id: id,
          type: 'CREDIT',
          amount: techEarnings,
          description: `Earnings from order #${id.slice(-6)}`,
        },
        {
          id: genId(),
          user_id: order.customer_id,
          order_id: id,
          type: 'DEBIT',
          amount: order.total_amount,
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
      service_requests!request_id(*, categories(*)),
      users!customer_id(id, name, avatar_url, phone),
      users!technician_id(id, name, avatar_url, phone, technician_profiles(*)),
      quotations(*),
      chat_messages(*, users!sender_id(id, name, avatar_url, role)),
      reviews(*)
    `).eq('id', id).maybeSingle();

    if (!data) return err('Order not found', 404);
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
      service_requests!request_id(*, categories(*)),
      users!customer_id(id, name, avatar_url, phone),
      users!technician_id(id, name, avatar_url, phone, technician_profiles(*)),
      quotations(*)
    `, { count: 'exact' });

    if (authResult.role === 'CUSTOMER') query = query.eq('customer_id', authResult.userId);
    if (authResult.role === 'TECHNICIAN') query = query.eq('technician_id', authResult.userId);
    if (status) query = query.eq('status', status);

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return ok({ orders: data ?? [], total: count ?? 0 });
  }

  return err('Not found', 404);
});
