import { listUsers, setUserActive, setUserRole, userHasFinancialRecords, deleteUser } from '../models/userModel.js';

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
}

// PATCH /api/users/:id/role (admin only)
export async function patchUserRole(req, res) {
  const { role } = req.body;
  if (!['admin', 'investor'].includes(role)) {
    return res.status(400).json({ error: "role must be 'admin' or 'investor'." });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role.' });
  }

  const updated = await setUserRole(req.params.id, role);
  if (!updated) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user: updated });
}

// DELETE /api/users/:id (admin only)
export async function removeUser(req, res) {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  const hasHistory = await userHasFinancialRecords(req.params.id);
  if (hasHistory) {
    return res.status(400).json({
      error:
        'This account has investment or distribution history and cannot be deleted, to protect that financial record. Use "Remove Access" to deactivate it instead.',
    });
  }

  const deleted = await deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.status(204).send();
}
