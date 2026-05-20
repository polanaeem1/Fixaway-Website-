import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, created, err, getPathSegments, getQuery, genId } from '../_shared/db.ts';
import { requireAuth, requireRole } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;
  const q = getQuery(req);

  // POST /requests  – create a new service request
  if (method === 'POST' && (segments.length === 0 || segments.at(-1) === 'requests')) {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { categoryId, type, title, description, mediaUrls, lat, lng, address } = await req.json();
    if (!title || !description) return err('Title and description are required');

    const { data: request, error: reqErr } = await adminDb.from('service_requests').insert({
      id: genId(),
      customerId: authResult.userId,
      categoryId: categoryId ?? null,
      type: type ?? 'HOME',
      title,
      description,
      mediaUrls: mediaUrls ?? [],
      lat: lat ?? null,
      lng: lng ?? null,
      address: address ?? null,
      updatedAt: new Date().toISOString()
    }).select(`*, categories(*), users!customerId(id, name, avatarUrl)`).single();

    if (reqErr) return err(`Failed to create request: ${reqErr.message}`, 500);

    // Broadcast to technicians via Supabase Realtime
    const realtimeClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    realtimeClient.channel('technicians').send({
      type: 'broadcast', event: 'new_request', payload: request,
    });

    return created(request, 'Service request created');
  }

  // GET /requests/all  (admin)
  if (method === 'GET' && segments.at(-1) === 'all') {
    const authResult = await requireRole(req, 'ADMIN');
    if (authResult instanceof Response) return authResult;

    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 20);
    const status = q.get('status');

    let query = adminDb.from('service_requests')
      .select('*, categories(*), users!customerId(id, name, email), orders(*)', { count: 'exact' });
    if (status) query = query.eq('status', status);

    const { data, count } = await query
      .order('createdAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return ok({ requests: data ?? [], total: count ?? 0 });
  }

  // GET /requests/nearby  (technicians – open PENDING requests)
  if (method === 'GET' && segments.at(-1) === 'nearby') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { data } = await adminDb.from('service_requests')
      .select('*, categories(*), users!customerId(id, name, avatarUrl)')
      .eq('status', 'PENDING')
      .order('createdAt', { ascending: false })
      .limit(50);

    return ok(data ?? []);
  }

  // GET /requests/:id  (single)
  if (method === 'GET' && segments.length >= 1 && segments.at(-1) !== 'requests') {
    const id = segments.at(-1)!;
    const { data } = await adminDb.from('service_requests')
      .select(`
        *, categories(*),
        users!customerId(id, name, avatarUrl, phone),
        quotations(*, users!technicianId(id, name, avatarUrl, technician_profiles(*))),
        orders(*)
      `)
      .eq('id', id).maybeSingle();
    if (!data) return err('Request not found', 404);

    if (data.quotations) {
      data.quotations = data.quotations.map((q: any) => {
        if (q.users && q.users.technician_profiles) {
          q.users.technicianProfile = q.users.technician_profiles[0] || null;
          delete q.users.technician_profiles;
        }
        return q;
      });
    }

    return ok(data);
  }

  // PATCH /requests/:id/cancel
  if (method === 'PATCH' && segments.at(-1) === 'cancel') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const id = segments[segments.length - 2];
    const { data: request } = await adminDb.from('service_requests')
      .select('id, customerId, status').eq('id', id).maybeSingle();
    if (!request) return err('Request not found', 404);
    if (request.customerId !== authResult.userId) return err('Unauthorized', 403);
    if (['IN_PROGRESS', 'COMPLETED'].includes(request.status)) {
      return err('Cannot cancel this request');
    }

    const { data: updated } = await adminDb.from('service_requests')
      .update({ status: 'CANCELLED', updatedAt: new Date().toISOString() }).eq('id', id).select().single();

    return ok(updated, 'Request cancelled');
  }

  // GET /requests  – my requests
  if (method === 'GET') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 10);
    const status = q.get('status');

    let query = adminDb.from('service_requests')
      .select(`
        *, categories(*),
        quotations(*, users!technicianId(id, name, avatarUrl)),
        orders(*, reviews(*), users!technicianId(id, name))
      `, { count: 'exact' })
      .eq('customerId', authResult.userId);

    if (status) query = query.eq('status', status);

    const { data, count } = await query
      .order('createdAt', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return ok({ requests: data ?? [], total: count ?? 0 });
  }

  return err('Not found', 404);
});
