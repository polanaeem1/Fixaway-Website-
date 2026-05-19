import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, created, err, getPathSegments, genId } from '../_shared/db.ts';
import { requireAuth } from '../_shared/auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;

  // POST /quotations  – technician submits quote
  if (method === 'POST' && (segments.length === 0 || segments.at(-1) === 'quotations')) {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { requestId, price, note, eta } = await req.json();
    if (!requestId || !price) return err('requestId and price are required');

    const { data: request } = await adminDb.from('service_requests')
      .select('id, status, customer_id').eq('id', requestId).maybeSingle();
    if (!request) return err('Request not found', 404);
    if (request.status !== 'PENDING') return err('Request is no longer accepting quotes');

    const { data: existing } = await adminDb.from('quotations')
      .select('id').eq('request_id', requestId).eq('technician_id', authResult.userId).maybeSingle();
    if (existing) return err('You already submitted a quotation for this request');

    const { data: quotation, error: qErr } = await adminDb.from('quotations').insert({
      id: genId(),
      request_id: requestId,
      technician_id: authResult.userId,
      price: Number(price),
      note: note ?? null,
      eta: eta ?? null,
    }).select(`*, users!technician_id(id, name, avatar_url, technician_profiles(*))`).single();

    if (qErr) return err(`Failed to create quotation: ${qErr.message}`, 500);

    // Update request status to QUOTED
    await adminDb.from('service_requests').update({ status: 'QUOTED' }).eq('id', requestId);

    // Broadcast to customer via Supabase Realtime
    const rt = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    rt.channel(`user:${request.customer_id}`).send({
      type: 'broadcast', event: 'new_quotation', payload: quotation,
    });

    return created(quotation, 'Quotation submitted');
  }

  // PATCH /quotations/:id/accept  – customer accepts quote
  if (method === 'PATCH' && segments.at(-1) === 'accept') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const id = segments[segments.length - 2];
    const { data: quotation } = await adminDb.from('quotations')
      .select('*, service_requests!request_id(id, customer_id)')
      .eq('id', id).maybeSingle();
    if (!quotation) return err('Quotation not found', 404);
    if (quotation.service_requests.customer_id !== authResult.userId) return err('Unauthorized', 403);

    // Reject all other quotations for the same request
    await adminDb.from('quotations')
      .update({ status: 'REJECTED' })
      .eq('request_id', quotation.request_id)
      .neq('id', id);

    const { data: updatedQuotation } = await adminDb.from('quotations')
      .update({ status: 'ACCEPTED' }).eq('id', id).select().single();

    // Create the order
    const { data: order, error: oErr } = await adminDb.from('orders').insert({
      id: genId(),
      request_id: quotation.request_id,
      quotation_id: id,
      customer_id: authResult.userId,
      technician_id: quotation.technician_id,
      total_amount: quotation.price,
    }).select(`
      *,
      users!customer_id(id, name, phone),
      users!technician_id(id, name, phone)
    `).single();

    if (oErr) return err(`Failed to create order: ${oErr.message}`, 500);

    // Update request status to ACCEPTED
    await adminDb.from('service_requests').update({ status: 'ACCEPTED' }).eq('id', quotation.request_id);

    // Broadcast to technician
    const rt = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    rt.channel(`user:${quotation.technician_id}`).send({
      type: 'broadcast', event: 'quotation_accepted', payload: order,
    });

    return ok({ quotation: updatedQuotation, order }, 'Quotation accepted, order created');
  }

  // PATCH /quotations/:id/reject
  if (method === 'PATCH' && segments.at(-1) === 'reject') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const id = segments[segments.length - 2];
    const { data: quotation } = await adminDb.from('quotations')
      .select('*, service_requests!request_id(customer_id)').eq('id', id).maybeSingle();
    if (!quotation) return err('Quotation not found', 404);
    if (quotation.service_requests.customer_id !== authResult.userId) return err('Unauthorized', 403);

    await adminDb.from('quotations').update({ status: 'REJECTED' }).eq('id', id);
    return ok(null, 'Quotation rejected');
  }

  return err('Not found', 404);
});
