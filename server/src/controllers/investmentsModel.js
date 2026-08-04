import { getCompanyByIdForUser } from '../models/companyModel.js';
import {
  listInvestmentsForCompany,
  listInvestmentsForInvestor,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from '../models/investmentsModel.js';

export async function getInvestments(req, res) {
  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found, or you do not have access to it.' });
  }
  const { from, to } = req.query;

  if (req.user.role === 'admin') {
    const investments = await listInvestmentsForCompany(req.params.id, { from, to });
    return res.json({ investments });
  }

  const investments = await listInvestmentsForInvestor(req.params.id, req.user.id, { from, to });
  return res.json({ investments });
}

export async function postInvestment(req, res) {
  const { investorId, investedOn, amount, notes } = req.body;

  if (!investorId || !investedOn || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Investor, date, and amount are all required.' });
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found.' });
  }

  const entry = await createInvestment({
    companyId: req.params.id,
    investorId,
    investedOn,
    amount: numericAmount,
    notes,
    createdBy: req.user.id,
  });
  return res.status(201).json({ investment: entry });
}

export async function patchInvestment(req, res) {
  const { investedOn, amount, notes } = req.body;

  if (!investedOn || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Date and amount are both required.' });
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  const updated = await updateInvestment(req.params.investmentId, req.params.id, {
    investedOn,
    amount: numericAmount,
    notes,
  });
  if (!updated) {
    return res.status(404).json({ error: 'Investment entry not found.' });
  }
  return res.json({ investment: updated });
}

export async function removeInvestment(req, res) {
  const removed = await deleteInvestment(req.params.investmentId, req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Investment entry not found.' });
  }
  return res.status(204).send();
}
