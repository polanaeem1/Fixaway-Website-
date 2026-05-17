import { Router } from 'express';
import { register, login, refreshToken, getMe, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateProfile);

export default router;
