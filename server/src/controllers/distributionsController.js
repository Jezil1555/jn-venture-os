import { getCompanyByIdForUser } from '../models/companyModel.js';
import { listInvestorsForCompany } from '../models/companyModel.js';
import {
  listDistributionsForCompany,
  listDistributionsForInvestor,
  createDistribution,
  updateDistribution,
  deleteDistribution,
} from '../models/distributionsModel.js';
import { sendDistributionNotification } from '../services/emailService.js';

export async function getDistributions(req, res) {
  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found, or you do not have access to it.' });
  }
  const { from, to } = req.query;

  if (req.user.role === 'admin') {
    const distributions = await listDistributionsForCompany(req.params.id, { from, to });
    return res.json({ distributions });
  }

  const distributions = await listDistributionsForInvestor(req.params.id, req.user.id, { from, to });
  return res.json({ distributions });
}

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

  const linkedInvestors = await listInvestorsForCompany(req.params.id);
  const investor = linkedInvestors.find((inv) => inv.id === investorId);
  if (!investor) {
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

  sendDistributionNotification({
    investorEmail: investor.email,
    investorName: investor.name,
    companyName: company.name,
    distribution: entry,
    currency: company.currency,
  }).catch((err) => console.error('[email] distribution notification failed:', err.message));

  return res.status(201).json({ distribution: entry });
}

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

export async function removeDistribution(req, res) {
  const removed = await deleteDistribution(req.params.distributionId, req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Distribution entry not found.' });
  }
  return res.status(204).send();
}
