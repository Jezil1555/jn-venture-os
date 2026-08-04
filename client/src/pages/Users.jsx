server/src/models/userModel.js
https://github.com/Jezil1555/jn-venture-os/blob/main/server/src/models/userModel.js
import { query } from '../config/db.js';

export async function findUserByEmail(email) {
  const { rows } = await query(
    `SELECT id, name, email, password_hash, role, is_active
     FROM users
     WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const { rows } = await query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ name, email, passwordHash, role }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash, role]
  );
  return rows[0];
}

export async function listUsers({ role } = {}) {
  if (role) {
    const { rows } = await query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users WHERE role = $1 ORDER BY name ASC`,
      [role]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users ORDER BY name ASC`
  );
  return rows;
}

export async function updateUserProfile(userId, { name, email }) {
  const { rows } = await query(
    `UPDATE users SET name = $1, email = $2, updated_at = now()
     WHERE id = $3
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, userId]
  );
  return rows[0] || null;
}

export async function setUserActive(userId, isActive) {
  const { rows } = await query(
    `UPDATE users SET is_active = $1, updated_at = now()
     WHERE id = $2
     RETURNING id, name, email, role, is_active, created_at`,
    [isActive, userId]
  );
  return rows[0] || null;
}server/src/controllers/userController.js
https://github.com/Jezil1555/jn-venture-os/blob/main/server/src/controllers/userController.js
import { listUsers, setUserActive } from '../models/userModel.js';

// GET /api/users?role=investor (admin only)
export async function getUsers(req, res) {
  const { role } = req.query;
  if (role && !['admin', 'investor'].includes(role)) {
    return res.status(400).json({ error: "role filter must be 'admin' or 'investor'." });
  }
  const users = await listUsers({ role });
  return res.json({ users });
}

// PATCH /api/users/:id/status (admin only)
export async function patchUserStatus(req, res) {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be true or false.' });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot deactivate your own account.' });
  }

  const updated = await setUserActive(req.params.id, isActive);
  if (!updated) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user: updated });
}https://github.com/Jezil1555/jn-venture-os/blob/main/server/src/routes/userRoutes.js
import { Router } from 'express';
import { getUsers, patchUserStatus } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/', asyncHandler(getUsers));
router.patch('/:id/status', asyncHandler(patchUserStatus));

export default router;

server/src/controllers/userController.js
