import { Router } from 'express';
import { getMessages, sendMessage, reportChat } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/:orderId', authenticate, getMessages);
router.post('/:orderId', authenticate, sendMessage);
router.post('/:orderId/report', authenticate, reportChat);

export default router;
