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
      .select('id, status, customerId').eq('id', requestId).maybeSingle();
    if (!request) return err('Request not found', 404);
    if (request.status !== 'PENDING') return err('Request is no longer accepting quotes');

    const { data: existing } = await adminDb.from('quotations')
      .select('id').eq('requestId', requestId).eq('technicianId', authResult.userId).maybeSingle();
    if (existing) return err('You already submitted a quotation for this request');

    const { data: quotation, error: qErr } = await adminDb.from('quotations').insert({
      id: genId(),
      requestId: requestId,
      technicianId: authResult.userId,
      price: Number(price),
      note: note ?? null,
      eta: eta ?? null,
      updatedAt: new Date().toISOString()
    }).select(`*, users!technicianId(id, name, avatarUrl, technician_profiles(*))`).single();

    if (qErr) return err(`Failed to create quotation: ${qErr.message}`, 500);

    // Update request status to QUOTED
    await adminDb.from('service_requests').update({ status: 'QUOTED', updatedAt: new Date().toISOString() }).eq('id', requestId);

    if (quotation && quotation.users && quotation.users.technician_profiles) {
      quotation.users.technicianProfile = quotation.users.technician_profiles[0] || null;
      delete quotation.users.technician_profiles;
    }

    // Broadcast to customer via Supabase Realtime
    const rt = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    rt.channel(`user:${request.customerId}`).send({
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
      .select('*, service_requests!requestId(id, customerId, status)')
      .eq('id', id).maybeSingle();
    if (!quotation) return err('Quotation not found', 404);
    if (quotation.service_requests.customerId !== authResult.userId) return err('Unauthorized', 403);

    const status = quotation.service_requests.status;
    if (status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED') {
      return err('An order has already been created for this request', 400);
    }

    // Reject all other quotations for the same request
    await adminDb.from('quotations')
      .update({ status: 'REJECTED', updatedAt: new Date().toISOString() })
      .eq('requestId', quotation.requestId)
      .neq('id', id);

    const { data: updatedQuotation } = await adminDb.from('quotations')
      .update({ status: 'ACCEPTED', updatedAt: new Date().toISOString() }).eq('id', id).select().single();

    // Create the order
    const { data: order, error: oErr } = await adminDb.from('orders').insert({
      id: genId(),
      requestId: quotation.requestId,
      quotationId: id,
      customerId: authResult.userId,
      technicianId: quotation.technicianId,
      totalAmount: quotation.price,
      updatedAt: new Date().toISOString()
    }).select(`
      *,
      customer:users!customerId(id, name, phone),
      technician:users!technicianId(id, name, phone)
    `).single();

    if (oErr) return err(`Failed to create order: ${oErr.message}`, 500);

    // Update request status to ACCEPTED
    await adminDb.from('service_requests').update({ status: 'ACCEPTED', updatedAt: new Date().toISOString() }).eq('id', quotation.requestId);

    // Broadcast to technician
    const rt = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    rt.channel(`user:${quotation.technicianId}`).send({
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
      .select('*, service_requests!requestId(customerId)').eq('id', id).maybeSingle();
    if (!quotation) return err('Quotation not found', 404);
    if (quotation.service_requests.customerId !== authResult.userId) return err('Unauthorized', 403);

    await adminDb.from('quotations').update({ status: 'REJECTED', updatedAt: new Date().toISOString() }).eq('id', id);
    return ok(null, 'Quotation rejected');
  }

  return err('Not found', 404);
});
