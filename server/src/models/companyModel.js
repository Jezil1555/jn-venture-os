import { query } from '../config/db.js';

// Admins see every company. Investors only see companies they hold a
// row for in investor_companies — that join table IS the permission.
export async function listCompaniesForUser(user) {
  if (user.role === 'admin') {
    const { rows } = await query(
      `SELECT id, name, description, industry, status, created_at
       FROM companies
       ORDER BY created_at DESC`
    );
    return rows;
  }

  const { rows } = await query(
    `SELECT c.id, c.name, c.description, c.industry, c.status, c.created_at,
            ic.ownership_percentage, ic.capital_committed
     FROM companies c
     INNER JOIN investor_companies ic ON ic.company_id = c.id
     WHERE ic.investor_id = $1
     ORDER BY c.created_at DESC`,
    [user.id]
  );
  return rows;
}

export async function getCompanyByIdForUser(companyId, user) {
  if (user.role === 'admin') {
    const { rows } = await query(
      `SELECT id, name, description, industry, status, created_at
       FROM companies WHERE id = $1`,
      [companyId]
    );
    return rows[0] || null;
  }

  const { rows } = await query(
    `SELECT c.id, c.name, c.description, c.industry, c.status, c.created_at,
            ic.ownership_percentage, ic.capital_committed
     FROM companies c
     INNER JOIN investor_companies ic ON ic.company_id = c.id
     WHERE c.id = $1 AND ic.investor_id = $2`,
    [companyId, user.id]
  );
  return rows[0] || null;
}

export async function createCompany({ name, description, industry, createdBy }) {
  const { rows } = await query(
    `INSERT INTO companies (name, description, industry, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, description, industry, status, created_at`,
    [name, description || null, industry || null, createdBy]
  );
  return rows[0];
}

export async function updateCompany(companyId, fields) {
  const allowed = ['name', 'description', 'industry', 'status'];
  const sets = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${i}`);
      values.push(fields[key]);
      i += 1;
    }
  }
  if (sets.length === 0) return getCompanyByIdForUser(companyId, { role: 'admin' });

  sets.push(`updated_at = now()`);
  values.push(companyId);

  const { rows } = await query(
    `UPDATE companies SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, name, description, industry, status, created_at, updated_at`,
    values
  );
  return rows[0] || null;
}

export async function deleteCompany(companyId) {
  const { rowCount } = await query(`DELETE FROM companies WHERE id = $1`, [companyId]);
  return rowCount > 0;
}

// Link/unlink an investor to a company, or update their stake.
export async function upsertInvestorLink({ investorId, companyId, ownershipPercentage, capitalCommitted }) {
  const { rows } = await query(
    `INSERT INTO investor_companies (investor_id, company_id, ownership_percentage, capital_committed)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (investor_id, company_id)
     DO UPDATE SET ownership_percentage = EXCLUDED.ownership_percentage,
                    capital_committed = EXCLUDED.capital_committed
     RETURNING id, investor_id, company_id, ownership_percentage, capital_committed`,
    [investorId, companyId, ownershipPercentage ?? 0, capitalCommitted ?? 0]
  );
  return rows[0];
}

export async function removeInvestorLink({ investorId, companyId }) {
  const { rowCount } = await query(
    `DELETE FROM investor_companies WHERE investor_id = $1 AND company_id = $2`,
    [investorId, companyId]
  );
  return rowCount > 0;
}

export async function listInvestorsForCompany(companyId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, ic.ownership_percentage, ic.capital_committed
     FROM investor_companies ic
     INNER JOIN users u ON u.id = ic.investor_id
     WHERE ic.company_id = $1
     ORDER BY ic.ownership_percentage DESC`,
    [companyId]
  );
  return rows;
}
