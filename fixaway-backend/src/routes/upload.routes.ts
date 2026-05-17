import { Router } from 'express';
import { uploadMedia } from '../controllers/upload.controller';
import { upload } from '../middleware/upload.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/upload  — requires auth, accepts a single file field named "media"
router.post('/', authenticate, upload.single('media'), uploadMedia);

export default router;
