import { Router } from 'express';
import { getUsers } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', asyncHandler(getUsers));

export default router;
