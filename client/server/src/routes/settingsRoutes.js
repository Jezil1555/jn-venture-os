import { Router } from 'express';
import { get, patch } from '../controllers/settingsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(get));
router.patch('/', requireAuth, requireRole('admin'), asyncHandler(patch));

export default router;
