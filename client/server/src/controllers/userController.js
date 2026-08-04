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
// This deactivates rather than deletes — a hard delete would cascade and
// erase that investor's distribution history (the schema references
// users.id with ON DELETE CASCADE there on purpose, so financial records
// can't silently point at nothing). Deactivating has the same practical
// effect — they can no longer log in — without losing the ledger.
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
