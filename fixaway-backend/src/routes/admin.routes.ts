import { Router } from 'express';
import {
  getStats, getUsers, getFraudAlerts, resolveFraudAlert, toggleUserStatus,
} from '../controllers/admin.controller';
import {
  getPendingVerifications, verifyTechnician, getAllTechnicians,
} from '../controllers/technician.controller';
import { getAllRequests } from '../controllers/request.controller';
import { getAllOrders } from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

const guard = [authenticate, requireRole('ADMIN')];

router.get('/stats', ...guard, getStats);
router.get('/users', ...guard, getUsers);
router.patch('/users/:id/toggle', ...guard, toggleUserStatus);
router.get('/technicians', ...guard, getAllTechnicians);
router.get('/technicians/pending', ...guard, getPendingVerifications);
router.patch('/technicians/:id/verify', ...guard, verifyTechnician);
router.get('/requests', ...guard, getAllRequests);
router.get('/orders', ...guard, getAllOrders);
router.get('/fraud-alerts', ...guard, getFraudAlerts);
router.patch('/fraud-alerts/:id/resolve', ...guard, resolveFraudAlert);

export default router;
