import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, created, err, getPathSegments, genId } from '../_shared/db.ts';
import { requireAuth } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;

  // Resolve orderId from path:
  // GET  /chat/:orderId
  // POST /chat/:orderId
  // POST /chat/:orderId/report

  const isReport = segments.at(-1) === 'report';
  const orderId = isReport ? segments[segments.length - 2] : segments.at(-1);

  if (!orderId || orderId === 'chat') return err('orderId is required', 400);

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  // ── GET messages ────────────────────────────────────────────────────────────
  if (method === 'GET') {
    const { data: messages } = await adminDb.from('chat_messages')
      .select('*, users!sender_id(id, name, avatar_url, role)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    return ok(messages ?? []);
  }

  // ── POST /chat/:orderId/report ───────────────────────────────────────────────
  if (method === 'POST' && isReport) {
    const { reason, messageId } = await req.json();
    if (!reason) return err('Reason is required');

    const { data: order } = await adminDb.from('orders')
      .select('id, customer_id, technician_id').eq('id', orderId).maybeSingle();
    if (!order) return err('Order not found', 404);

    let finalDescription = `Reported by user (ID: ${authResult.userId}): ${reason}`;

    if (messageId) {
      const { data: msg } = await adminDb.from('chat_messages')
        .select('content, media_url').eq('id', messageId).maybeSingle();
      if (msg) {
        finalDescription += `\nFlagged Message: "${msg.content}"${msg.media_url ? ` [Media: ${msg.media_url}]` : ''}`;
      }
    }

    const { data: alert, error: alertErr } = await adminDb.from('fraud_alerts').insert({
      id: genId(),
      order_id: orderId,
      type: 'SUSPICIOUS_ACTIVITY',
      description: finalDescription,
    }).select().single();

    if (alertErr) return err(`Failed to create alert: ${alertErr.message}`, 500);
    return created(alert, 'Report submitted successfully to the admin');
  }

  // ── POST /chat/:orderId  – send message ─────────────────────────────────────
  if (method === 'POST') {
    const { content, mediaUrl } = await req.json();
    if (!content && !mediaUrl) return err('Message content or media is required');

    const { data: order } = await adminDb.from('orders')
      .select('id, customer_id, technician_id').eq('id', orderId).maybeSingle();
    if (!order) return err('Order not found', 404);

    const isParticipant =
      order.customer_id === authResult.userId || order.technician_id === authResult.userId;
    if (!isParticipant) return err('Not a participant in this order', 403);

    const { data: message, error: msgErr } = await adminDb.from('chat_messages').insert({
      id: genId(),
      order_id: orderId,
      sender_id: authResult.userId,
      content: content ?? '',
      media_url: mediaUrl ?? null,
    }).select('*, users!sender_id(id, name, avatar_url, role)').single();

    if (msgErr) return err(`Failed to send message: ${msgErr.message}`, 500);

    // Broadcast to order room via Supabase Realtime
    const rt = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await rt.channel(`order:${orderId}`).send({
      type: 'broadcast',
      event: 'message_received',
      payload: message,
    });

    return created(message);
  }

  return err('Not found', 404);
});
