import { query } from '../config/db.js';

export async function listSalesForCompany(companyId) {
  const { rows } = await query(
    `SELECT id, company_id, sale_date, amount, notes, created_at
     FROM sales
     WHERE company_id = $1
     ORDER BY sale_date DESC, created_at DESC`,
    [companyId]
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

export async function totalSalesForCompany(companyId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM sales WHERE company_id = $1`,
    [companyId]
  );
  return Number(rows[0].total);
}
