import { Router } from 'express';
import { getUsers, patchUserStatus, patchUserRole, patchUserBank, removeUser } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', asyncHandler(getUsers));
router.patch('/:id/status', asyncHandler(patchUserStatus));
router.patch('/:id/role', asyncHandler(patchUserRole));
router.patch('/:id/bank', asyncHandler(patchUserBank));
router.delete('/:id', asyncHandler(removeUser));

export default router;
