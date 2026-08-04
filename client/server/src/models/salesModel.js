import { query } from '../config/db.js';
import pool from '../config/db.js';

export async function listSalesForCompany(companyId, { from, to } = {}) {
  const conditions = ['company_id = $1'];
  const params = [companyId];

  if (from) {
    params.push(from);
    conditions.push(`sale_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`sale_date <= $${params.length}`);
  }

  const { rows } = await query(
    `SELECT id, company_id, sale_date, amount, notes, created_at
     FROM sales
     WHERE ${conditions.join(' AND ')}
     ORDER BY sale_date DESC, created_at DESC`,
    params
  );
  return rows;
}

export async function createSale({ companyId, saleDate, amount, notes, createdBy }) {
  const { rows } = await query(
    `INSERT INTO sales (company_id, sale_date, amount, notes, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, company_id, sale_date, amount, notes, created_at`,
    [companyId, saleDate, amount, notes || null, createdBy]
  );
  return rows[0];
}

export async function deleteSale(saleId, companyId) {
  const { rowCount } = await query(`DELETE FROM sales WHERE id = $1 AND company_id = $2`, [
    saleId,
    companyId,
  ]);
  return rowCount > 0;
}

export async function totalSalesForCompany(companyId, { from, to } = {}) {
  const conditions = ['company_id = $1'];
  const params = [companyId];

  if (from) {
    params.push(from);
    conditions.push(`sale_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`sale_date <= $${params.length}`);
  }

  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM sales WHERE ${conditions.join(' AND ')}`,
    params
  );
  return Number(rows[0].total);
}

// Used for the Overview dashboard, which shows the current month's sales
// rather than an all-time total.
export async function salesThisMonthForCompany(companyId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM sales
     WHERE company_id = $1
       AND sale_date >= date_trunc('month', CURRENT_DATE)
       AND sale_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'`,
    [companyId]
  );
  return Number(rows[0].total);
}

// Used for spreadsheet imports — inserts many rows in one transaction so
// a mid-import failure can't leave the company with half-imported data.
export async function bulkCreateSales(companyId, rows, createdBy) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let inserted = 0;
    for (const row of rows) {
      await client.query(
        `INSERT INTO sales (company_id, sale_date, amount, notes, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [companyId, row.saleDate, row.amount, row.notes || null, createdBy]
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

// Deletes many sale rows at once, scoped to the given company so a
// request can't reach into another company's data by passing arbitrary
// IDs. Returns how many rows were actually deleted.
export async function bulkDeleteSales(companyId, saleIds) {
  const { rowCount } = await query(
    `DELETE FROM sales WHERE company_id = $1 AND id = ANY($2::uuid[])`,
    [companyId, saleIds]
  );
  return rowCount;
}
