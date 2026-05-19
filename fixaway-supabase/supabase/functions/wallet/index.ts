import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, created, err, getPathSegments, getQuery, genId } from '../_shared/db.ts';
import { requireAuth } from '../_shared/auth.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;
  const q = getQuery(req);

  const authResult = await requireAuth(req);
  if (authResult instanceof Response) return authResult;

  // GET /wallet/transactions
  if (method === 'GET' && segments.at(-1) === 'transactions') {
    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 20);

    const { data: transactions, count } = await adminDb.from('wallet_transactions')
      .select('*, orders!order_id(id)', { count: 'exact' })
      .eq('user_id', authResult.userId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return ok({ transactions: transactions ?? [], total: count ?? 0 });
  }

  // GET /wallet/earnings  (technician 7-day bar chart)
  if (method === 'GET' && segments.at(-1) === 'earnings') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: txns } = await adminDb.from('wallet_transactions')
      .select('amount, created_at')
      .eq('user_id', authResult.userId)
      .eq('type', 'CREDIT')
      .gte('created_at', sevenDaysAgo.toISOString());

    const dailyTotals = Array(7).fill(0);
    let todayTotal = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const tx of txns ?? []) {
      const txDate = new Date(tx.created_at);
      txDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        dailyTotals[6 - diffDays] += tx.amount;
      }
      if (diffDays === 0) todayTotal += tx.amount;
    }

    const max = Math.max(...dailyTotals, 1);
    const barHeights = dailyTotals.map((t) => `${Math.max(10, Math.round((t / max) * 100))}%`);

    return ok({ dailyTotals, todayTotal, barHeights });
  }

  // POST /wallet/add-funds
  if (method === 'POST' && segments.at(-1) === 'add-funds') {
    const { amount } = await req.json();
    if (!amount || amount <= 0) return err('Valid amount is required');

    const { data: transaction, error: txErr } = await adminDb.from('wallet_transactions').insert({
      id: genId(),
      user_id: authResult.userId,
      type: 'CREDIT',
      amount: Number(amount),
      description: 'Wallet top-up',
    }).select().single();

    if (txErr) return err(`Failed to add funds: ${txErr.message}`, 500);
    return created(transaction, `EGP ${amount} added successfully`);
  }

  // GET /wallet  – balance
  if (method === 'GET') {
    if (authResult.role === 'TECHNICIAN') {
      const { data: profile } = await adminDb.from('technician_profiles')
        .select('wallet_balance').eq('user_id', authResult.userId).maybeSingle();
      return ok({ balance: profile?.wallet_balance ?? 0 });
    }

    // Customer: compute from transactions
    const { data: txns } = await adminDb.from('wallet_transactions')
      .select('type, amount').eq('user_id', authResult.userId);

    const balance = (txns ?? []).reduce((acc: number, t: any) =>
      t.type === 'CREDIT' ? acc + t.amount : acc - t.amount, 0);

    return ok({ balance });
  }

  return err('Not found', 404);
});
