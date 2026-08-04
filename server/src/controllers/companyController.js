import {
  listCompaniesForUser,
  getCompanyByIdForUser,
  createCompany,
  updateCompany,
  deleteCompany,
  upsertInvestorLink,
  removeInvestorLink,
  listInvestorsForCompany,
} from '../models/companyModel.js';

// GET /api/companies
// Admins get every company; investors get only the ones they're linked to.
export async function listCompanies(req, res) {
  const companies = await listCompaniesForUser(req.user);
  return res.json({ companies });
}

// GET /api/companies/:id
export async function getCompany(req, res) {
  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found, or you do not have access to it.' });
  }
  return res.json({ company });
}

// POST /api/companies (admin only)
export async function postCompany(req, res) {
  const { name, description, industry, currency, totalProjectCost } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Company name is required.' });
  }
  if (currency && !['USD', 'INR', 'QAR'].includes(currency)) {
    return res.status(400).json({ error: 'Currency must be USD, INR, or QAR.' });
  }
  const company = await createCompany({
    name,
    description,
    industry,
    currency,
    totalProjectCost,
    createdBy: req.user.id,
  });
  return res.status(201).json({ company });
}

// PATCH /api/companies/:id (admin only)
export async function patchCompany(req, res) {
  const { name, description, industry, status, currency, totalProjectCost } = req.body;
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (description !== undefined) fields.description = description;
  if (industry !== undefined) fields.industry = industry;
  if (status !== undefined) fields.status = status;
  if (currency !== undefined) fields.currency = currency;
  if (totalProjectCost !== undefined) fields.total_project_cost = totalProjectCost;

  const company = await updateCompany(req.params.id, fields);
  if (!company) {
    return res.status(404).json({ error: 'Company not found.' });
  }
  return res.json({ company });
}

// DELETE /api/companies/:id (admin only)
export async function removeCompany(req, res) {
  const deleted = await deleteCompany(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Company not found.' });
  }
  return res.status(204).send();
}

// GET /api/companies/:id/investors (admin only)
export async function getCompanyInvestors(req, res) {
  const investors = await listInvestorsForCompany(req.params.id);
  return res.json({ investors });
}

// PUT /api/companies/:id/investors/:investorId (admin only)
// Grants an investor visibility into this company with no investment yet —
// an edge case. The normal path is logging their first investment, which
// creates this same link automatically.
export async function putCompanyInvestor(req, res) {
  const { id: companyId, investorId } = req.params;
  const link = await upsertInvestorLink({ investorId, companyId });
  return res.json({ link });
}

// DELETE /api/companies/:id/investors/:investorId (admin only)
export async function deleteCompanyInvestor(req, res) {
  const { id: companyId, investorId } = req.params;
  const removed = await removeInvestorLink({ investorId, companyId });
  if (!removed) {
    return res.status(404).json({ error: 'That investor is not linked to this company.' });
  }
  return res.status(204).send();
}
