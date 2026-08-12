import { Router } from 'express';
import { getUsers, patchUserStatus, removeUser } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', asyncHandler(getUsers));
router.patch('/:id/status', asyncHandler(patchUserStatus));
router.delete('/:id', asyncHandler(removeUser));

export default router;
