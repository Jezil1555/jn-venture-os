import { Router } from 'express';
import { get, patch } from '../controllers/settingsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET is intentionally public — brand tagline/story/vision text isn't
// sensitive, and the login screen (which loads before anyone is
// authenticated) needs to read it to show a live tagline. Only PATCH
// stays admin-only.
router.get('/', asyncHandler(get));
router.patch('/', requireAuth, requireRole('admin'), asyncHandler(patch));

export default router;
