import { Router } from 'express';
import { submitQuotation, acceptQuotation, rejectQuotation } from '../controllers/quotation.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, requireRole('TECHNICIAN'), submitQuotation);
router.patch('/:id/accept', authenticate, requireRole('CUSTOMER'), acceptQuotation);
router.patch('/:id/reject', authenticate, requireRole('CUSTOMER'), rejectQuotation);

export default router;
