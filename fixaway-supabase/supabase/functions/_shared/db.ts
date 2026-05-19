import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Supabase admin client — bypasses RLS, has full DB access */
export const adminDb = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── snake_case → camelCase transformer ──────────────────────────────────────
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        snakeToCamel(k),
        toCamel(v),
      ]),
    );
  }
  return obj;
}

// ─── Response helpers ────────────────────────────────────────────────────────

export function ok(data: unknown, message?: string, status = 200): Response {
  return new Response(
    JSON.stringify({ success: true, data: toCamel(data), message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

export function created(data: unknown, message?: string): Response {
  return ok(data, message, 201);
}

export function err(message: string, status = 400): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

// ─── URL path helpers ─────────────────────────────────────────────────────────

/** Extract path segments after the function name.
 *  e.g. /functions/v1/chat/orderId123 → ['orderId123']
 */
export function getPathSegments(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  return parts;
}

export function getQuery(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

// ─── Crypto (cuid-like) ───────────────────────────────────────────────────────
export function genId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 25);
}
