import { query } from '../config/db.js';
import pool from '../config/db.js';

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

// Used for spreadsheet imports — same transactional all-or-nothing pattern
// as bulkCreateSales.
export async function bulkCreateReturns(companyId, rows, createdBy) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    for (const row of rows) {
      await client.query(
        `INSERT INTO returns_received (company_id, received_on, amount, notes, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [companyId, row.receivedOn, row.amount, row.notes || null, createdBy]
      );
      inserted += 1;
    }
    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function bulkDeleteReturns(companyId, returnIds) {
  const { rowCount } = await query(
    `DELETE FROM returns_received WHERE company_id = $1 AND id = ANY($2::uuid[])`,
    [companyId, returnIds]
  );
  return rowCount;
}
