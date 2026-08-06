import { Router } from 'express';
import { get, patch, postTestEmail } from '../controllers/settingsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(get));
router.patch('/', requireAuth, requireRole('admin'), asyncHandler(patch));
router.post('/test-email', requireAuth, requireRole('admin'), asyncHandler(postTestEmail));

export default router;
