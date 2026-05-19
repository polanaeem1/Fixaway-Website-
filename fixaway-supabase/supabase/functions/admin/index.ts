import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, err, getPathSegments, getQuery, genId } from '../_shared/db.ts';
import { requireRole } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;
  const q = getQuery(req);

  const authResult = await requireRole(req, 'ADMIN');
  if (authResult instanceof Response) return authResult;

  // GET /admin/stats
  if (method === 'GET' && segments.at(-1) === 'stats') {
    const [
      { count: totalOrders },
      { count: activeTechnicians },
      { count: pendingVerifications },
      { count: fraudAlerts },
      { data: recentOrders },
      { data: completedOrders },
    ] = await Promise.all([
      adminDb.from('orders').select('*', { count: 'exact', head: true }),
      adminDb.from('technician_profiles').select('*', { count: 'exact', head: true }).eq('is_online', true),
      adminDb.from('technician_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', false),
      adminDb.from('fraud_alerts').select('*', { count: 'exact', head: true }).is('resolved_at', null),
      adminDb.from('orders').select(`
        id, status, total_amount, created_at,
        users!customer_id(id, name),
        users!technician_id(id, name),
        service_requests!request_id(*, categories(*))
      `).order('created_at', { ascending: false }).limit(5),
      adminDb.from('orders').select('total_amount').eq('status', 'COMPLETED'),
    ]);

    const totalRevenue = (completedOrders ?? []).reduce(
      (a: number, o: any) => a + o.total_amount * 0.15, 0,
    );

    return ok({
      totalOrders: totalOrders ?? 0,
      activeTechnicians: activeTechnicians ?? 0,
      pendingVerifications: pendingVerifications ?? 0,
      fraudAlerts: fraudAlerts ?? 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      recentOrders: recentOrders ?? [],
    });
  }

  // GET /admin/users
  if (method === 'GET' && segments.at(-1) === 'users') {
    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 20);
    const role = q.get('role');

    let query = adminDb.from('users').select(
      'id, name, email, phone, role, is_active, created_at, technician_profiles(*)',
      { count: 'exact' },
    );
    if (role) query = query.eq('role', role);

    const { data, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return ok({ users: data ?? [], total: count ?? 0 });
  }

  // PATCH /admin/users/:id/toggle
  if (method === 'PATCH' && segments.at(-1) === 'toggle') {
    const id = segments[segments.length - 2];
    const { data: user } = await adminDb.from('users').select('id, is_active').eq('id', id).maybeSingle();
    if (!user) return ok(null);
    const { data: updated } = await adminDb.from('users')
      .update({ is_active: !user.is_active }).eq('id', id).select('is_active').single();
    return ok({ isActive: updated?.is_active });
  }

  // GET /admin/fraud-alerts
  if (method === 'GET' && segments.at(-1) === 'fraud-alerts') {
    const { data: alerts } = await adminDb.from('fraud_alerts').select(`
      *,
      orders!order_id(
        id, customer_id, technician_id,
        users!customer_id(id, name),
        users!technician_id(id, name)
      )
    `).is('resolved_at', null).order('created_at', { ascending: false });

    return ok(alerts ?? []);
  }

  // PATCH /admin/fraud-alerts/:id/resolve
  if (method === 'PATCH' && segments.at(-1) === 'resolve') {
    const alertId = segments[segments.length - 2];
    const body = await req.json().catch(() => ({}));
    const { action, reportedUserId, fineAmount } = body;

    const { data: alert, error: alertErr } = await adminDb.from('fraud_alerts')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', alertId)
      .select()
      .single();

    if (alertErr) return err(`Failed to resolve alert: ${alertErr.message}`, 500);

    if (reportedUserId) {
      if (action === 'BAN') {
        await adminDb.from('users').update({ is_active: false }).eq('id', reportedUserId);
      } else if (action === 'FINE' && fineAmount > 0) {
        await adminDb.from('wallet_transactions').insert({
          id: genId(),
          user_id: reportedUserId,
          order_id: alert.order_id ?? null,
          type: 'DEBIT',
          amount: Number(fineAmount),
          description: `Fraud penalty for Alert #${alertId.slice(-6).toUpperCase()}`,
        });

        // Deduct from technician wallet balance if applicable
        const { data: techProfile } = await adminDb.from('technician_profiles')
          .select('wallet_balance').eq('user_id', reportedUserId).maybeSingle();
        if (techProfile) {
          await adminDb.from('technician_profiles').update({
            wallet_balance: Math.max(0, (techProfile.wallet_balance ?? 0) - Number(fineAmount)),
          }).eq('user_id', reportedUserId);
        }
      }
    }

    return ok(alert, 'Alert resolved and punishment applied successfully');
  }

  // GET /admin/analytics  – aggregated platform metrics
  if (method === 'GET' && segments.at(-1) === 'analytics') {
    const [
      { data: orders },
      { data: topTechs },
      { data: categories },
    ] = await Promise.all([
      adminDb.from('orders').select('total_amount, status'),
      adminDb.from('technician_profiles').select(`
        rating, total_jobs,
        users!user_id(id, name, avatar_url)
      `).order('rating', { ascending: false }).limit(5),
      adminDb.from('service_requests').select('categories(name)'),
    ]);

    const completed = (orders ?? []).filter((o: any) => o.status === 'COMPLETED');
    const totalRevenue = completed.reduce((a: number, o: any) => a + o.total_amount * 0.15, 0);
    const avgOrderValue = completed.length > 0
      ? completed.reduce((a: number, o: any) => a + o.total_amount, 0) / completed.length
      : 0;
    const completionRate = (orders ?? []).length > 0
      ? (completed.length / (orders ?? []).length) * 100
      : 0;

    // Category breakdown
    const catCounts: Record<string, number> = {};
    for (const r of categories ?? []) {
      const name = (r as any).categories?.name ?? 'Other';
      catCounts[name] = (catCounts[name] ?? 0) + 1;
    }

    return ok({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      completionRate: Math.round(completionRate * 10) / 10,
      topTechnicians: topTechs ?? [],
      categoryBreakdown: catCounts,
    });
  }

  return err('Not found', 404);
});
