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
    `SELECT id, name, email, role, is_active, created_at,
            bank_account_holder, bank_account_number, bank_name, bank_routing_code
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
      `SELECT id, name, email, role, is_active, created_at,
              bank_account_holder, bank_account_number, bank_name, bank_routing_code
       FROM users WHERE role = $1 ORDER BY name ASC`,
      [role]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT id, name, email, role, is_active, created_at,
            bank_account_holder, bank_account_number, bank_name, bank_routing_code
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
}

export async function setUserRole(userId, role) {
  const { rows } = await query(
    `UPDATE users SET role = $1, updated_at = now()
     WHERE id = $2
     RETURNING id, name, email, role, is_active, created_at`,
    [role, userId]
  );
  return rows[0] || null;
}

export async function setBankDetails(
  userId,
  { bankAccountHolder, bankAccountNumber, bankName, bankRoutingCode }
) {
  const { rows } = await query(
    `UPDATE users
     SET bank_account_holder = $1, bank_account_number = $2, bank_name = $3, bank_routing_code = $4,
         updated_at = now()
     WHERE id = $5
     RETURNING id, name, email, role, is_active, created_at,
               bank_account_holder, bank_account_number, bank_name, bank_routing_code`,
    [bankAccountHolder || null, bankAccountNumber || null, bankName || null, bankRoutingCode || null, userId]
  );
  return rows[0] || null;
}

export async function userHasFinancialRecords(userId) {
  const { rows } = await query(
    `SELECT
       EXISTS(SELECT 1 FROM investments WHERE investor_id = $1) AS has_investments,
       EXISTS(SELECT 1 FROM distributions WHERE investor_id = $1) AS has_distributions`,
    [userId]
  );
  return rows[0].has_investments || rows[0].has_distributions;
}

export async function deleteUser(userId) {
  const { rowCount } = await query(`DELETE FROM users WHERE id = $1`, [userId]);
  return rowCount > 0;
}
