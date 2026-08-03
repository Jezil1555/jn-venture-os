import { getCompanyByIdForUser } from '../models/companyModel.js';
import {
  listReturnsForCompany,
  createReturn,
  deleteReturn,
  totalReturnsForCompany,
} from '../models/returnsModel.js';

// This ledger — money the holding company received back from a portfolio
// company — is deliberately admin-only, both to view and to edit. It's an
// internal record. Investors only ever see a derived "pending to receive"
// figure computed from this, never the raw entries. Route middleware
// already enforces requireRole('admin'); this just confirms the company
// itself is real before attaching anything to it.

// GET /api/companies/:id/returns (admin only)
export async function getReturns(req, res) {
  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found.' });
  }
  const [returns, total] = await Promise.all([
    listReturnsForCompany(req.params.id),
    totalReturnsForCompany(req.params.id),
  ]);
  return res.json({ returns, total });
}

// POST /api/companies/:id/returns (admin only)
export async function postReturn(req, res) {
  const { receivedOn, amount, notes } = req.body;

  if (!receivedOn || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Date received and amount are both required.' });
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return res.status(400).json({ error: 'Amount must be a number.' });
  }

  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found.' });
  }

  const entry = await createReturn({
    companyId: req.params.id,
    receivedOn,
    amount: numericAmount,
    notes,
    createdBy: req.user.id,
  });
  return res.status(201).json({ return: entry });
}

// DELETE /api/companies/:id/returns/:returnId (admin only)
export async function removeReturn(req, res) {
  const removed = await deleteReturn(req.params.returnId, req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Return entry not found.' });
  }
  return res.status(204).send();
}
