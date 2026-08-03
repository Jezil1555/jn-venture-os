import { Router } from 'express';
import { login, register, me, updateProfile, changePassword } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/register', requireAuth, requireRole('admin'), asyncHandler(register));
router.get('/me', requireAuth, asyncHandler(me));
router.patch('/profile', requireAuth, asyncHandler(updateProfile));
router.patch('/password', requireAuth, asyncHandler(changePassword));

export default router;
