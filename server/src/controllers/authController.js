import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { findUserByEmail, findUserById, createUser } from '../models/userModel.js';

const TOKEN_TTL = '12h';
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function publicUser(user) {
  const { password_hash, ...rest } = user; // eslint-disable-line no-unused-vars
  return rest;
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await findUserByEmail(email.toLowerCase().trim());
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  const token = signToken(user);
  return res.json({ token, user: publicUser(user) });
}

// POST /api/auth/register
// Admin-only: creates a new admin or investor account. There is no public
// self-signup — the holding company controls who gets access.
export async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are all required.' });
  }
  if (!['admin', 'investor'].includes(role)) {
    return res.status(400).json({ error: "Role must be 'admin' or 'investor'." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existing = await findUserByEmail(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
  });

  return res.status(201).json({ user });
}

// GET /api/auth/me
export async function me(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user });
}

// PATCH /api/auth/password
// Any logged-in user can change their own password, but must prove they
// know the current one first — this isn't an admin reset.
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are both required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [
    passwordHash,
    user.id,
  ]);

  return res.json({ ok: true });
}
