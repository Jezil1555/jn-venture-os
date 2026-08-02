import { listUsers } from '../models/userModel.js';

// GET /api/users?role=investor (admin only)
export async function getUsers(req, res) {
  const { role } = req.query;
  if (role && !['admin', 'investor'].includes(role)) {
    return res.status(400).json({ error: "role filter must be 'admin' or 'investor'." });
  }
  const users = await listUsers({ role });
  return res.json({ users });
}
