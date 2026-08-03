import { query } from '../config/db.js';

export async function listReturnsForCompany(companyId) {
  const { rows } = await query(
    `SELECT id, company_id, amount, received_on, notes, created_at
     FROM returns_received
     WHERE company_id = $1
     ORDER BY received_on DESC, created_at DESC`,
    [companyId]
  );
  return rows;
}

export async function createReturn({ companyId, receivedOn, amount, notes, createdBy }) {
  const { rows } = await query(
    `INSERT INTO returns_received (company_id, received_on, amount, notes, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, company_id, amount, received_on, notes, created_at`,
    [companyId, receivedOn, amount, notes || null, createdBy]
  );
  return rows[0];
}

export async function deleteReturn(returnId, companyId) {
  const { rowCount } = await query(`DELETE FROM returns_received WHERE id = $1 AND company_id = $2`, [
    returnId,
    companyId,
  ]);
  return rowCount > 0;
}

export async function totalReturnsForCompany(companyId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM returns_received WHERE company_id = $1`,
    [companyId]
  );
  return Number(rows[0].total);
}
