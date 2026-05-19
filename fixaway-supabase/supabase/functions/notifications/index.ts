import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, err, getPathSegments, getQuery } from '../_shared/db.ts';
import { requireAuth } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;
  const q = getQuery(req);

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  // PATCH /notifications/read-all
  if (method === 'PATCH' && segments.at(-1) === 'read-all') {
    await adminDb.from('notifications')
      .update({ is_read: true })
      .eq('user_id', authResult.userId)
      .eq('is_read', false);
    return ok(null, 'All notifications marked as read');
  }

  // PATCH /notifications/:id/read
  if (method === 'PATCH' && segments.at(-1) === 'read') {
    const id = segments[segments.length - 2];
    const { data: notif } = await adminDb.from('notifications')
      .select('id, user_id').eq('id', id).maybeSingle();
    if (!notif) return err('Notification not found', 404);
    if (notif.user_id !== authResult.userId) return err('Unauthorized', 403);
    await adminDb.from('notifications').update({ is_read: true }).eq('id', id);
    return ok(null, 'Marked as read');
  }

  // GET /notifications
  if (method === 'GET') {
    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 20);

    const [{ data: notifications, count }, { count: unreadCount }] = await Promise.all([
      adminDb.from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', authResult.userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1),
      adminDb.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authResult.userId)
        .eq('is_read', false),
    ]);

    return ok({
      notifications: notifications ?? [],
      total: count ?? 0,
      unreadCount: unreadCount ?? 0,
    });
  }

  return err('Not found', 404);
});
