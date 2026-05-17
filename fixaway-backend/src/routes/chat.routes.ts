import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/:orderId', authenticate, getMessages);
router.post('/:orderId', authenticate, sendMessage);

export default router;
