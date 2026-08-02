import { query } from '../config/db.js';

// All distributions for a company, with investor names attached — admin view.
export async function listDistributionsForCompany(companyId) {
  const { rows } = await query(
    `SELECT d.id, d.investor_id, d.company_id, d.amount, d.distributed_on, d.notes, d.created_at,
            u.name AS investor_name
     FROM distributions d
     INNER JOIN users u ON u.id = d.investor_id
     WHERE d.company_id = $1
     ORDER BY d.distributed_on DESC, d.created_at DESC`,
    [companyId]
  );
  return rows;
}

// Just one investor's distributions for a company — investor's own view.
export async function listDistributionsForInvestor(companyId, investorId) {
  const { rows } = await query(
    `SELECT id, investor_id, company_id, amount, distributed_on, notes, created_at
     FROM distributions
     WHERE company_id = $1 AND investor_id = $2
     ORDER BY distributed_on DESC, created_at DESC`,
    [companyId, investorId]
  );
  return rows;
}

export async function totalDistributionsForInvestor(companyId, investorId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM distributions
     WHERE company_id = $1 AND investor_id = $2`,
    [companyId, investorId]
  );
  return Number(rows[0].total);
}

export async function createDistribution({ companyId, investorId, distributedOn, amount, notes, createdBy }) {
  const { rows } = await query(
    `INSERT INTO distributions (company_id, investor_id, distributed_on, amount, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, company_id, investor_id, amount, distributed_on, notes, created_at`,
    [companyId, investorId, distributedOn, amount, notes || null, createdBy]
  );
  return rows[0];
}

export async function updateDistribution(distributionId, companyId, { distributedOn, amount, notes }) {
  const { rows } = await query(
    `UPDATE distributions
     SET distributed_on = $1, amount = $2, notes = $3
     WHERE id = $4 AND company_id = $5
     RETURNING id, company_id, investor_id, amount, distributed_on, notes, created_at`,
    [distributedOn, amount, notes || null, distributionId, companyId]
  );
  return rows[0] || null;
}

export async function deleteDistribution(distributionId, companyId) {
  const { rowCount } = await query(`DELETE FROM distributions WHERE id = $1 AND company_id = $2`, [
    distributionId,
    companyId,
  ]);
  return rowCount > 0;
}
