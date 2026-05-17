import { Router } from 'express';
import {
  getNearbyTechnicians, getTechnicianById, updateStatus,
  getAllTechnicians, verifyTechnician, getPendingVerifications,
} from '../controllers/technician.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/nearby', authenticate, getNearbyTechnicians);
router.get('/pending-verifications', authenticate, requireRole('ADMIN'), getPendingVerifications);
router.get('/', authenticate, requireRole('ADMIN'), getAllTechnicians);
router.get('/:id', getTechnicianById);
router.patch('/status', authenticate, requireRole('TECHNICIAN'), updateStatus);
router.patch('/:id/verify', authenticate, requireRole('ADMIN'), verifyTechnician);

export default router;
