import { getCompanyByIdForUser } from '../models/companyModel.js';
import { listInvestorsForCompany } from '../models/companyModel.js';
import {
  listDistributionsForCompany,
  listDistributionsForInvestor,
  createDistribution,
  updateDistribution,
  deleteDistribution,
} from '../models/distributionsModel.js';

// GET /api/companies/:id/distributions
// Admin sees every investor's distributions for this company.
// Investor sees only their own — never another investor's figures.
export async function getDistributions(req, res) {
  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found, or you do not have access to it.' });
  }

  if (req.user.role === 'admin') {
    const distributions = await listDistributionsForCompany(req.params.id);
    return res.json({ distributions });
  }

  const distributions = await listDistributionsForInvestor(req.params.id, req.user.id);
  return res.json({ distributions });
}

// POST /api/companies/:id/distributions (admin only)
export async function postDistribution(req, res) {
  const { investorId, distributedOn, amount, notes } = req.body;

  if (!investorId || !distributedOn || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Investor, date, and amount are all required.' });
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return res.status(400).json({ error: 'Amount must be a number.' });
  }

  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found.' });
  }

  // Confirm this investor is actually linked to the company before
  // recording a payout to them for it.
  const linkedInvestors = await listInvestorsForCompany(req.params.id);
  const isLinked = linkedInvestors.some((inv) => inv.id === investorId);
  if (!isLinked) {
    return res.status(400).json({ error: 'That investor is not linked to this company.' });
  }

  const entry = await createDistribution({
    companyId: req.params.id,
    investorId,
    distributedOn,
    amount: numericAmount,
    notes,
    createdBy: req.user.id,
  });
  return res.status(201).json({ distribution: entry });
}

// PATCH /api/companies/:id/distributions/:distributionId (admin only)
export async function patchDistribution(req, res) {
  const { distributedOn, amount, notes } = req.body;

  if (!distributedOn || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Date and amount are both required.' });
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return res.status(400).json({ error: 'Amount must be a number.' });
  }

  const updated = await updateDistribution(req.params.distributionId, req.params.id, {
    distributedOn,
    amount: numericAmount,
    notes,
  });
  if (!updated) {
    return res.status(404).json({ error: 'Distribution entry not found.' });
  }
  return res.json({ distribution: updated });
}

// DELETE /api/companies/:id/distributions/:distributionId (admin only)
export async function removeDistribution(req, res) {
  const removed = await deleteDistribution(req.params.distributionId, req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Distribution entry not found.' });
  }
  return res.status(204).send();
}
