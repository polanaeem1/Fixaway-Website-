import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError, sendCreated } from '../utils/response';

export const register = async (req: Request, res: Response) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 'Name, email and password are required');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return sendError(res, 'Email already registered', 409);
  }

  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return sendError(res, 'Phone number already registered', 409);
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const allowedRoles = ['CUSTOMER', 'TECHNICIAN'];
  const userRole = allowedRoles.includes(role) ? role : 'CUSTOMER';

  const user = await prisma.user.create({
    data: { name, email, phone: phone || null, passwordHash, role: userRole },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });

  if (userRole === 'TECHNICIAN') {
    await prisma.technicianProfile.create({ data: { userId: user.id } });
  }

  const tokenPayload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  return sendCreated(res, { user, accessToken, refreshToken }, 'Registration successful');
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email and password are required');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return sendError(res, 'Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid credentials', 401);
  }

  const tokenPayload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  const { passwordHash: _, ...userWithoutPassword } = user;

  return sendSuccess(res, { user: userWithoutPassword, accessToken, refreshToken }, 'Login successful');
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) return sendError(res, 'Refresh token required', 401);

  try {
    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return sendError(res, 'User not found', 404);

    const tokenPayload = { userId: user.id, role: user.role, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    return sendSuccess(res, { accessToken });
  } catch {
    return sendError(res, 'Invalid refresh token', 401);
  }
};

export const getMe = async (req: any, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true, name: true, email: true, phone: true, role: true, avatarUrl: true,
      createdAt: true, technicianProfile: true,
    },
  });
  if (!user) return sendError(res, 'User not found', 404);
  return sendSuccess(res, user);
};

export const updateProfile = async (req: any, res: Response) => {
  const { name, phone, password, avatarUrl, bio, specialties } = req.body;
  const updateData: any = {};
  
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone || null;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 12);
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true }
    });

    if (req.user.role === 'TECHNICIAN' && (bio !== undefined || specialties !== undefined)) {
      const techUpdate: any = {};
      if (bio !== undefined) techUpdate.bio = bio;
      if (specialties !== undefined) techUpdate.specialties = specialties;
      await prisma.technicianProfile.update({
        where: { userId: req.user.userId },
        data: techUpdate
      });
    }

    return sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update profile', 500);
  }
};
