import { query } from '../config/db.js';

export async function listInvestmentsForCompany(companyId, { from, to } = {}) {
  const conditions = ['i.company_id = $1'];
  const params = [companyId];

  if (from) {
    params.push(from);
    conditions.push(`i.invested_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`i.invested_on <= $${params.length}`);
  }

  const { rows } = await query(
    `SELECT i.id, i.investor_id, i.company_id, i.amount, i.invested_on, i.notes, i.created_at,
            u.name AS investor_name
     FROM investments i
     INNER JOIN users u ON u.id = i.investor_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY i.invested_on DESC, i.created_at DESC`,
    params
  );
  return rows;
}

export async function listInvestmentsForInvestor(companyId, investorId, { from, to } = {}) {
  const conditions = ['company_id = $1', 'investor_id = $2'];
  const params = [companyId, investorId];

  if (from) {
    params.push(from);
    conditions.push(`invested_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`invested_on <= $${params.length}`);
  }

  const { rows } = await query(
    `SELECT id, investor_id, company_id, amount, invested_on, notes, created_at
     FROM investments
     WHERE ${conditions.join(' AND ')}
     ORDER BY invested_on DESC, created_at DESC`,
    params
  );
  return rows;
}

export async function listInvestmentTotalsForCompany(companyId) {
  const { rows } = await query(
    `SELECT i.investor_id, u.name AS investor_name, u.email AS investor_email,
            SUM(i.amount) AS total_invested
     FROM investments i
     INNER JOIN users u ON u.id = i.investor_id
     WHERE i.company_id = $1
     GROUP BY i.investor_id, u.name, u.email
     ORDER BY SUM(i.amount) DESC`,
    [companyId]
  );
  return rows;
}

export async function createInvestment({ companyId, investorId, amount, investedOn, notes, createdBy }) {
  await query(
    `INSERT INTO investor_companies (investor_id, company_id)
     VALUES ($1, $2)
     ON CONFLICT (investor_id, company_id) DO NOTHING`,
    [investorId, companyId]
  );

  const { rows } = await query(
    `INSERT INTO investments (company_id, investor_id, invested_on, amount, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, company_id, investor_id, amount, invested_on, notes, created_at`,
    [companyId, investorId, investedOn, amount, notes || null, createdBy]
  );
  return rows[0];
}

export async function updateInvestment(investmentId, companyId, { investedOn, amount, notes }) {
  const { rows } = await query(
    `UPDATE investments
     SET invested_on = $1, amount = $2, notes = $3
     WHERE id = $4 AND company_id = $5
     RETURNING id, company_id, investor_id, amount, invested_on, notes, created_at`,
    [investedOn, amount, notes || null, investmentId, companyId]
  );
  return rows[0] || null;
}

export async function deleteInvestment(investmentId, companyId) {
  const { rowCount } = await query(`DELETE FROM investments WHERE id = $1 AND company_id = $2`, [
    investmentId,
    companyId,
  ]);
  return rowCount > 0;
}
