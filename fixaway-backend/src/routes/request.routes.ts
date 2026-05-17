import { Router } from 'express';
import {
  createRequest, getMyRequests, getNearbyRequests,
  getRequestById, cancelRequest, getAllRequests,
} from '../controllers/request.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, requireRole('CUSTOMER'), createRequest);
router.get('/', authenticate, getMyRequests);
router.get('/nearby', authenticate, requireRole('TECHNICIAN'), getNearbyRequests);
router.get('/all', authenticate, requireRole('ADMIN'), getAllRequests);
router.get('/:id', authenticate, getRequestById);
router.patch('/:id/cancel', authenticate, requireRole('CUSTOMER'), cancelRequest);

export default router;
