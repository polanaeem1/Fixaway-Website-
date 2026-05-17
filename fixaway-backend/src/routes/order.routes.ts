import { Router } from 'express';
import { getMyOrders, getOrderById, updateOrderStatus, getAllOrders } from '../controllers/order.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getMyOrders);
router.get('/all', authenticate, requireRole('ADMIN'), getAllOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, updateOrderStatus);

export default router;
