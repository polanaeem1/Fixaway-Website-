import { Router } from 'express';
import { submitReview } from '../controllers/review.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, requireRole('CUSTOMER'), submitReview);

export default router;
