import { Router } from 'express';
import {
  getWallet, getTransactions, addFunds, submitReview,
  getNotifications, markNotificationRead, getEarnings,
} from '../controllers/wallet.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/balance', authenticate, getWallet);
router.get('/earnings', authenticate, requireRole('TECHNICIAN'), getEarnings);
router.get('/transactions', authenticate, getTransactions);
router.post('/add-funds', authenticate, addFunds);
router.post('/review', authenticate, submitReview);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

export default router;
