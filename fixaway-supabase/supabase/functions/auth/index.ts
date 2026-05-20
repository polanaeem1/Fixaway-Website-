import { handleCors } from '../_shared/cors.ts';
import { adminDb, ok, created, err, getPathSegments, genId } from '../_shared/db.ts';
import { requireAuth, signAccessToken, signRefreshToken, verifyRefreshToken } from '../_shared/auth.ts';

// bcrypt via npm compat shim
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const segments = getPathSegments(req);
  const method = req.method;

  // POST /auth/register
  if (method === 'POST' && segments.at(-1) === 'register') {
    const { name, email, phone, password, role } = await req.json();
    if (!name || !email || !password) return err('Name, email and password are required');

    const { data: existing } = await adminDb.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return err('Email already registered', 409);

    if (phone) {
      const { data: existingPhone } = await adminDb.from('users').select('id').eq('phone', phone).maybeSingle();
      if (existingPhone) return err('Phone number already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const allowedRoles = ['CUSTOMER', 'TECHNICIAN'];
    const userRole = allowedRoles.includes(role) ? role : 'CUSTOMER';
    const userId = genId();

    const { data: user, error: userErr } = await adminDb.from('users').insert({
      id: userId, name, email, phone: phone || null, passwordHash: passwordHash, role: userRole,
      updatedAt: new Date().toISOString()
    }).select('id, name, email, phone, role, createdAt').single();

    if (userErr) return err(`Failed to create user: ${userErr.message}`, 500);

    if (userRole === 'TECHNICIAN') {
      await adminDb.from('technician_profiles').insert({ id: genId(), userId: userId });
    }

    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    return created({ user, accessToken, refreshToken }, 'Registration successful');
  }

  // POST /auth/login
  if (method === 'POST' && segments.at(-1) === 'login') {
    const { email, password } = await req.json();
    if (!email || !password) return err('Email and password are required');

    const { data: user } = await adminDb.from('users')
      .select('id, name, email, phone, role, avatarUrl, isActive, passwordHash, createdAt')
      .eq('email', email).maybeSingle();

    if (!user || !user.isActive) return err('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return err('Invalid credentials', 401);

    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return ok({ user: userWithoutPassword, accessToken, refreshToken }, 'Login successful');
  }

  // POST /auth/refresh
  if (method === 'POST' && segments.at(-1) === 'refresh') {
    const { refreshToken: token } = await req.json();
    if (!token) return err('Refresh token required', 401);
    try {
      const decoded = await verifyRefreshToken(token);
      const { data: user } = await adminDb.from('users').select('id, role, email').eq('id', decoded.userId).maybeSingle();
      if (!user) return err('User not found', 404);
      const tokenPayload = { userId: user.id, role: user.role, email: user.email };
      const accessToken = await signAccessToken(tokenPayload);
      return ok({ accessToken });
    } catch {
      return err('Invalid refresh token', 401);
    }
  }

  // GET /auth/me
  if (method === 'GET' && segments.at(-1) === 'me') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const { data: user } = await adminDb.from('users')
      .select('id, name, email, phone, role, avatarUrl, createdAt, technician_profiles(*)')
      .eq('id', authResult.userId).maybeSingle();

    if (!user) return err('User not found', 404);

    if (user.technician_profiles) {
      user.technicianProfile = user.technician_profiles[0] || null;
      delete user.technician_profiles;
    }

    return ok(user);
  }

  // PATCH /auth/me
  if (method === 'PATCH' && segments.at(-1) === 'me') {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const body = await req.json();
    const { name, phone, password, avatarUrl, bio, specialties } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error: updateErr } = await adminDb.from('users')
      .update(updateData).eq('id', authResult.userId)
      .select('id, name, email, phone, role, avatarUrl').single();

    if (updateErr) return err('Failed to update profile', 500);

    if (authResult.role === 'TECHNICIAN' && (bio !== undefined || specialties !== undefined)) {
      const techUpdate: Record<string, unknown> = {};
      if (bio !== undefined) techUpdate.bio = bio;
      if (specialties !== undefined) techUpdate.specialties = specialties;
      await adminDb.from('technician_profiles').update(techUpdate).eq('userId', authResult.userId);
    }

    return ok(user, 'Profile updated successfully');
  }

  return err('Not found', 404);
});
