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
  const { name, description, industry, currency } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Company name is required.' });
  }
  if (currency && !['USD', 'INR', 'QAR'].includes(currency)) {
    return res.status(400).json({ error: 'Currency must be USD, INR, or QAR.' });
  }
  const company = await createCompany({ name, description, industry, currency, createdBy: req.user.id });
  return res.status(201).json({ company });
}

// PATCH /api/companies/:id (admin only)
export async function patchCompany(req, res) {
  const company = await updateCompany(req.params.id, req.body);
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
// Links an investor to this company (or updates their stake).
export async function putCompanyInvestor(req, res) {
  const { id: companyId, investorId } = req.params;
  const { ownershipPercentage, capitalCommitted } = req.body;

  const link = await upsertInvestorLink({
    investorId,
    companyId,
    ownershipPercentage,
    capitalCommitted,
  });
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
