import { verify, decode } from 'https://deno.land/x/djwt@v2.9.1/mod.ts';
import { err } from './db.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') ?? 'fixaway-secret-key-change-in-production';

let _key: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (_key) return _key;
  _key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  return _key;
}

export interface AuthUser {
  userId: string;
  role: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  email: string;
}

/** Extract and verify Bearer JWT. Returns null on failure. */
export async function verifyToken(req: Request): Promise<AuthUser | null> {
  try {
    const auth = req.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    const key = await getKey();
    const payload = await verify(token, key);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

/** Middleware-style: returns AuthUser or a 401 Response */
export async function requireAuth(req: Request): Promise<AuthUser | Response> {
  const user = await verifyToken(req);
  if (!user) return err('Unauthorized – invalid or missing token', 401);
  return user;
}

/** Require a specific role */
export async function requireRole(
  req: Request,
  role: 'ADMIN' | 'TECHNICIAN' | 'CUSTOMER',
): Promise<AuthUser | Response> {
  const user = await requireAuth(req);
  if (user instanceof Response) return user;
  if (user.role !== role) return err('Forbidden – insufficient role', 403);
  return user;
}

/** Sign an access token (15 min) */
export async function signAccessToken(payload: AuthUser): Promise<string> {
  const { create } = await import('https://deno.land/x/djwt@v2.9.1/mod.ts');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return create({ alg: 'HS256', typ: 'JWT' }, { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 15 }, key);
}

/** Sign a refresh token (7 days) */
export async function signRefreshToken(payload: AuthUser): Promise<string> {
  const { create } = await import('https://deno.land/x/djwt@v2.9.1/mod.ts');
  const refreshSecret = Deno.env.get('JWT_REFRESH_SECRET') ?? 'fixaway-refresh-secret-change-in-production';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(refreshSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return create({ alg: 'HS256', typ: 'JWT' }, { ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, key);
}

/** Verify refresh token */
export async function verifyRefreshToken(token: string): Promise<AuthUser> {
  const refreshSecret = Deno.env.get('JWT_REFRESH_SECRET') ?? 'fixaway-refresh-secret-change-in-production';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(refreshSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const payload = await verify(token, key);
  return payload as unknown as AuthUser;
}
