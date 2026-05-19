import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, created, err, getPathSegments, getQuery } from '../_shared/db.ts';
import { requireAuth, requireRole } from '../_shared/auth.ts';

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;
  const q = getQuery(req);

  // GET /technicians/nearby
  if (method === 'GET' && segments.at(-1) === 'nearby') {
    const lat = Number(q.get('lat'));
    const lng = Number(q.get('lng'));
    const radius = Number(q.get('radius') ?? 10);
    if (!lat || !lng) return err('lat and lng are required');

    const { data: profiles } = await adminDb.from('technician_profiles')
      .select('*, users!inner(id, name, avatar_url)')
      .eq('is_online', true).eq('is_verified', true)
      .not('lat', 'is', null).not('lng', 'is', null);

    const nearby = (profiles ?? [])
      .map((t: any) => ({ ...t, distance: haversine(lat, lng, t.lat, t.lng) }))
      .filter((t: any) => t.distance <= radius)
      .sort((a: any, b: any) => a.distance - b.distance);

    return ok(nearby);
  }

  // GET /technicians/pending  (admin)
  if (method === 'GET' && segments.at(-1) === 'pending') {
    const authResult = await requireRole(req, 'ADMIN');
    if (authResult instanceof Response) return authResult;

    const { data } = await adminDb.from('technician_profiles')
      .select('*, users!inner(id, name, email, avatar_url, created_at)')
      .eq('is_verified', false).order('created_at', { ascending: false });

    return ok(data ?? []);
  }

  // PATCH /technicians/status  (technician own)
  if (method === 'PATCH' && segments.at(-1) === 'status') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { isOnline, lat, lng } = await req.json();
    const { data: profile } = await adminDb.from('technician_profiles')
      .update({ is_online: isOnline, lat, lng })
      .eq('user_id', authResult.userId)
      .select().single();

    return ok(profile, 'Status updated');
  }

  // PATCH /technicians/:id/verify  (admin)
  if (method === 'PATCH' && segments.at(-1) === 'verify') {
    const authResult = await requireRole(req, 'ADMIN');
    if (authResult instanceof Response) return authResult;

    const techId = segments[segments.length - 2]; // /technicians/:id/verify
    const { data: profile } = await adminDb.from('technician_profiles')
      .update({ is_verified: true }).eq('user_id', techId).select().single();

    return ok(profile, 'Technician verified');
  }

  // GET /technicians/:id  (single profile)
  if (method === 'GET' && segments.length >= 1 && segments.at(-1) !== 'technicians') {
    const id = segments.at(-1)!;
    const { data } = await adminDb.from('technician_profiles')
      .select('*, users!inner(id, name, avatar_url, email, phone)')
      .eq('user_id', id).maybeSingle();
    if (!data) return err('Technician not found', 404);
    return ok(data);
  }

  // GET /technicians  (admin list)
  if (method === 'GET') {
    const authResult = await requireRole(req, 'ADMIN');
    if (authResult instanceof Response) return authResult;

    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 20);
    const verified = q.get('verified');

    let query = adminDb.from('technician_profiles')
      .select('*, users!inner(id, name, email, avatar_url)', { count: 'exact' });
    if (verified !== null) query = query.eq('is_verified', verified === 'true');

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return ok({ technicians: data ?? [], total: count ?? 0, page, limit });
  }

  return err('Not found', 404);
});
