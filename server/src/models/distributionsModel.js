import { query } from '../config/db.js';

export async function listDistributionsForCompany(companyId, { from, to } = {}) {
  const conditions = ['d.company_id = $1'];
  const params = [companyId];

  if (from) {
    params.push(from);
    conditions.push(`d.distributed_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`d.distributed_on <= $${params.length}`);
  }

  const { rows } = await query(
    `SELECT d.id, d.investor_id, d.company_id, d.amount, d.distributed_on, d.notes, d.created_at,
            d.paid_to_bank_account_holder, d.paid_to_bank_account_number,
            d.paid_to_bank_name, d.paid_to_bank_routing_code,
            u.name AS investor_name
     FROM distributions d
     INNER JOIN users u ON u.id = d.investor_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY d.distributed_on DESC, d.created_at DESC`,
    params
  );
  return rows;
}

export async function listDistributionsForInvestor(companyId, investorId, { from, to } = {}) {
  const conditions = ['company_id = $1', 'investor_id = $2'];
  const params = [companyId, investorId];

  if (from) {
    params.push(from);
    conditions.push(`distributed_on >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`distributed_on <= $${params.length}`);
  }

  const { rows } = await query(
    `SELECT id, investor_id, company_id, amount, distributed_on, notes, created_at,
            paid_to_bank_account_holder, paid_to_bank_account_number,
            paid_to_bank_name, paid_to_bank_routing_code
     FROM distributions
     WHERE ${conditions.join(' AND ')}
     ORDER BY distributed_on DESC, created_at DESC`,
    params
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

export async function createDistribution({
  companyId,
  investorId,
  distributedOn,
  amount,
  notes,
  createdBy,
  bankAccountHolder,
  bankAccountNumber,
  bankName,
  bankRoutingCode,
}) {
  const { rows } = await query(
    `INSERT INTO distributions (
       company_id, investor_id, distributed_on, amount, notes, created_by,
       paid_to_bank_account_holder, paid_to_bank_account_number, paid_to_bank_name, paid_to_bank_routing_code
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, company_id, investor_id, amount, distributed_on, notes, created_at,
               paid_to_bank_account_holder, paid_to_bank_account_number,
               paid_to_bank_name, paid_to_bank_routing_code`,
    [
      companyId,
      investorId,
      distributedOn,
      amount,
      notes || null,
      createdBy,
      bankAccountHolder || null,
      bankAccountNumber || null,
      bankName || null,
      bankRoutingCode || null,
    ]
  );
  return rows[0];
}

export async function updateDistribution(distributionId, companyId, { distributedOn, amount, notes }) {
  const { rows } = await query(
    `UPDATE distributions
     SET distributed_on = $1, amount = $2, notes = $3
     WHERE id = $4 AND company_id = $5
     RETURNING id, company_id, investor_id, amount, distributed_on, notes, created_at,
               paid_to_bank_account_holder, paid_to_bank_account_number,
               paid_to_bank_name, paid_to_bank_routing_code`,
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
