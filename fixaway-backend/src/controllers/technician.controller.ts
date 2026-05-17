import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/response';

// Haversine formula to calculate distance between two lat/lng points in km
const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getNearbyTechnicians = async (req: Request, res: Response) => {
  const { lat, lng, radius = 10 } = req.query;

  if (!lat || !lng) return sendError(res, 'lat and lng are required');

  const techProfiles = await prisma.technicianProfile.findMany({
    where: { isOnline: true, isVerified: true, lat: { not: null }, lng: { not: null } },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const nearby = techProfiles
    .map((t) => ({
      ...t,
      distance: haversineDistance(Number(lat), Number(lng), t.lat!, t.lng!),
    }))
    .filter((t) => t.distance <= Number(radius))
    .sort((a, b) => a.distance - b.distance);

  return sendSuccess(res, nearby);
};

export const getTechnicianById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const technician = await prisma.technicianProfile.findFirst({
    where: { userId: id as string },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, email: true, phone: true } },
    },
  });
  if (!technician) return sendError(res, 'Technician not found', 404);
  return sendSuccess(res, technician);
};

export const updateStatus = async (req: any, res: Response) => {
  const { isOnline, lat, lng } = req.body;
  const profile = await prisma.technicianProfile.update({
    where: { userId: req.user.userId },
    data: { isOnline, lat, lng },
  });
  return sendSuccess(res, profile, 'Status updated');
};

export const getAllTechnicians = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, verified } = req.query;
  const where: any = {};
  if (verified !== undefined) where.isVerified = verified === 'true';

  const [technicians, total] = await Promise.all([
    prisma.technicianProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.technicianProfile.count({ where }),
  ]);

  return sendSuccess(res, { technicians, total, page: Number(page), limit: Number(limit) });
};

export const verifyTechnician = async (req: Request, res: Response) => {
  const { id } = req.params;
  const profile = await prisma.technicianProfile.update({
    where: { userId: id as string },
    data: { isVerified: true },
  });
  return sendSuccess(res, profile, 'Technician verified');
};

export const getPendingVerifications = async (req: Request, res: Response) => {
  const technicians = await prisma.technicianProfile.findMany({
    where: { isVerified: false },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, technicians);
};
