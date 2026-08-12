import { query } from '../config/db.js';

export async function listCompaniesForUser(user) {
  if (user.role === 'admin') {
    const { rows } = await query(
      `SELECT c.id, c.name, c.description, c.industry, c.currency, c.total_project_cost,
              c.ec_holding_investment, c.status, c.created_at,
              COALESCE((SELECT SUM(amount) FROM sales WHERE company_id = c.id), 0) AS total_sales,
              COALESCE((SELECT SUM(amount) FROM sales
                        WHERE company_id = c.id
                          AND sale_date >= date_trunc('month', CURRENT_DATE)
                          AND sale_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'), 0) AS sales_this_month,
              COALESCE((SELECT SUM(amount) FROM investments WHERE company_id = c.id), 0) AS total_invested,
              COALESCE((SELECT SUM(amount) FROM returns_received WHERE company_id = c.id), 0) AS total_returns_received
       FROM companies c
       ORDER BY c.created_at DESC`
    );
    return rows.map((r) => {
      const totalEcHoldingInvestment = Number(r.ec_holding_investment) + Number(r.total_invested);
      return {
        ...r,
        total_ec_holding_investment: totalEcHoldingInvestment,
        unmanaged_balance: Math.max(Number(r.total_project_cost) - totalEcHoldingInvestment, 0),
      };
    });
  }

  const { rows } = await query(
    `SELECT c.id, c.name, c.description, c.industry, c.currency, c.total_project_cost,
            c.ec_holding_investment, c.status, c.created_at,
            COALESCE((SELECT SUM(amount) FROM investments
                      WHERE company_id = c.id AND investor_id = $1), 0) AS capital_committed,
            COALESCE((SELECT SUM(amount) FROM investments
                      WHERE company_id = c.id), 0) AS all_investors_total,
            COALESCE((SELECT SUM(amount) FROM distributions
                      WHERE company_id = c.id AND investor_id = $1), 0) AS returns_received_so_far,
            GREATEST(
              COALESCE((SELECT SUM(amount) FROM investments
                        WHERE company_id = c.id AND investor_id = $1), 0)
              - COALESCE((SELECT SUM(amount) FROM distributions
                          WHERE company_id = c.id AND investor_id = $1), 0),
              0
            ) AS pending_to_receive
     FROM companies c
     INNER JOIN investor_companies ic ON ic.company_id = c.id
     WHERE ic.investor_id = $1
     ORDER BY c.created_at DESC`,
    [user.id]
  );
  return rows.map((r) => {
    const totalEcHoldingInvestment = Number(r.ec_holding_investment) + Number(r.all_investors_total);
    return {
      ...r,
      total_ec_holding_investment: totalEcHoldingInvestment,
      unmanaged_balance: Math.max(Number(r.total_project_cost) - totalEcHoldingInvestment, 0),
      ownership_percentage:
        totalEcHoldingInvestment > 0 ? (Number(r.capital_committed) / totalEcHoldingInvestment) * 100 : 0,
      returns_percent:
        Number(r.capital_committed) > 0
          ? (Number(r.returns_received_so_far) / Number(r.capital_committed)) * 100
          : 0,
    };
  });
}

export async function getCompanyByIdForUser(companyId, user) {
  if (user.role === 'admin') {
    const { rows } = await query(
      `SELECT c.id, c.name, c.description, c.industry, c.currency, c.total_project_cost,
              c.ec_holding_investment, c.status, c.created_at,
              COALESCE((SELECT SUM(amount) FROM sales WHERE company_id = c.id), 0) AS total_sales,
              COALESCE((SELECT SUM(amount) FROM investments WHERE company_id = c.id), 0) AS total_invested,
              COALESCE((SELECT SUM(amount) FROM returns_received WHERE company_id = c.id), 0) AS total_returns_received
       FROM companies c WHERE c.id = $1`,
      [companyId]
    );
    const row = rows[0];
    if (!row) return null;
    const totalEcHoldingInvestment = Number(row.ec_holding_investment) + Number(row.total_invested);
    return {
      ...row,
      total_ec_holding_investment: totalEcHoldingInvestment,
      unmanaged_balance: Math.max(Number(row.total_project_cost) - totalEcHoldingInvestment, 0),
    };
  }

  const { rows } = await query(
    `SELECT c.id, c.name, c.description, c.industry, c.currency, c.total_project_cost,
            c.ec_holding_investment, c.status, c.created_at,
            COALESCE((SELECT SUM(amount) FROM investments
                      WHERE company_id = c.id AND investor_id = $2), 0) AS capital_committed,
            COALESCE((SELECT SUM(amount) FROM investments
                      WHERE company_id = c.id), 0) AS all_investors_total,
            COALESCE((SELECT SUM(amount) FROM distributions
                      WHERE company_id = c.id AND investor_id = $2), 0) AS returns_received_so_far,
            GREATEST(
              COALESCE((SELECT SUM(amount) FROM investments
                        WHERE company_id = c.id AND investor_id = $2), 0)
              - COALESCE((SELECT SUM(amount) FROM distributions
                          WHERE company_id = c.id AND investor_id = $2), 0),
              0
            ) AS pending_to_receive
     FROM companies c
     INNER JOIN investor_companies ic ON ic.company_id = c.id
     WHERE c.id = $1 AND ic.investor_id = $2`,
    [companyId, user.id]
  );
  const row = rows[0];
  if (!row) return null;
  const totalEcHoldingInvestment = Number(row.ec_holding_investment) + Number(row.all_investors_total);
  return {
    ...row,
    total_ec_holding_investment: totalEcHoldingInvestment,
    unmanaged_balance: Math.max(Number(row.total_project_cost) - totalEcHoldingInvestment, 0),
    ownership_percentage:
      totalEcHoldingInvestment > 0 ? (Number(row.capital_committed) / totalEcHoldingInvestment) * 100 : 0,
    returns_percent:
      Number(row.capital_committed) > 0
        ? (Number(row.returns_received_so_far) / Number(row.capital_committed)) * 100
        : 0,
  };
}

export async function createCompany({
  name,
  description,
  industry,
  currency,
  totalProjectCost,
  ecHoldingInvestment,
  createdBy,
}) {
  const { rows } = await query(
    `INSERT INTO companies (name, description, industry, currency, total_project_cost, ec_holding_investment, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, description, industry, currency, total_project_cost, ec_holding_investment, status, created_at`,
    [
      name,
      description || null,
      industry || null,
      currency || 'USD',
      totalProjectCost || 0,
      ecHoldingInvestment || 0,
      createdBy,
    ]
  );
  return rows[0];
}

export async function updateCompany(companyId, fields) {
  const allowed = [
    'name',
    'description',
    'industry',
    'status',
    'currency',
    'total_project_cost',
    'ec_holding_investment',
  ];
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
    `UPDATE companies SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, name, description, industry, currency, total_project_cost, ec_holding_investment, status, created_at, updated_at`,
    values
  );
  return rows[0] || null;
}

export async function deleteCompany(companyId) {
  const { rowCount } = await query(`DELETE FROM companies WHERE id = $1`, [companyId]);
  return rowCount > 0;
}

export async function upsertInvestorLink({ investorId, companyId }) {
  const { rows } = await query(
    `INSERT INTO investor_companies (investor_id, company_id)
     VALUES ($1, $2)
     ON CONFLICT (investor_id, company_id) DO NOTHING
     RETURNING id, investor_id, company_id`,
    [investorId, companyId]
  );
  if (rows[0]) return rows[0];
  const { rows: existing } = await query(
    `SELECT id, investor_id, company_id FROM investor_companies WHERE investor_id = $1 AND company_id = $2`,
    [investorId, companyId]
  );
  return existing[0];
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
    `SELECT u.id, u.name, u.email, c.total_project_cost, c.ec_holding_investment,
            COALESCE((SELECT SUM(amount) FROM investments
                      WHERE company_id = $1 AND investor_id = u.id), 0) AS capital_committed,
            COALESCE((SELECT SUM(amount) FROM investments WHERE company_id = $1), 0) AS all_investors_total
     FROM investor_companies ic
     INNER JOIN users u ON u.id = ic.investor_id
     INNER JOIN companies c ON c.id = ic.company_id
     WHERE ic.company_id = $1
     ORDER BY capital_committed DESC`,
    [companyId]
  );
  return rows.map((r) => {
    const totalEcHoldingInvestment = Number(r.ec_holding_investment) + Number(r.all_investors_total);
    return {
      ...r,
      ownership_percentage:
        totalEcHoldingInvestment > 0 ? (Number(r.capital_committed) / totalEcHoldingInvestment) * 100 : 0,
    };
  });
}
