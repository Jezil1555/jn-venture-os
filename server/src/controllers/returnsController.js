import { getCompanyByIdForUser } from '../models/companyModel.js';
import {
  listReturnsForCompany,
  createReturn,
  deleteReturn,
  totalReturnsForCompany,
  bulkCreateReturns,
  bulkDeleteReturns,
} from '../models/returnsModel.js';

const MAX_BULK_ROWS = 5000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

// POST /api/companies/:id/returns/bulk (admin only)
export async function postBulkReturns(req, res) {
  const { returns } = req.body;

  if (!Array.isArray(returns) || returns.length === 0) {
    return res.status(400).json({ error: 'No rows to import.' });
  }
  if (returns.length > MAX_BULK_ROWS) {
    return res.status(400).json({ error: `Cannot import more than ${MAX_BULK_ROWS} rows at once.` });
  }

  const cleanRows = [];
  const rowErrors = [];

  returns.forEach((row, index) => {
    const lineNo = index + 1;
    if (!row || typeof row !== 'object') {
      rowErrors.push({ row: lineNo, error: 'Malformed row.' });
      return;
    }
    if (!DATE_RE.test(row.receivedOn)) {
      rowErrors.push({ row: lineNo, error: 'Date must be in YYYY-MM-DD format.' });
      return;
    }
    const amount = Number(row.amount);
    if (Number.isNaN(amount) || amount < 0) {
      rowErrors.push({ row: lineNo, error: 'Amount must be a non-negative number.' });
      return;
    }
    cleanRows.push({
      receivedOn: row.receivedOn,
      amount,
      notes: row.notes ? String(row.notes).slice(0, 500) : null,
    });
  });

  if (rowErrors.length > 0) {
    return res.status(400).json({ error: 'Some rows failed validation.', rowErrors });
  }

  const company = await getCompanyByIdForUser(req.params.id, req.user);
  if (!company) {
    return res.status(404).json({ error: 'Company not found.' });
  }

  const inserted = await bulkCreateReturns(req.params.id, cleanRows, req.user.id);
  return res.status(201).json({ inserted });
}

// POST /api/companies/:id/returns/bulk-delete (admin only)
export async function postBulkDeleteReturns(req, res) {
  const { returnIds } = req.body;
  if (!Array.isArray(returnIds) || returnIds.length === 0) {
    return res.status(400).json({ error: 'No rows selected.' });
  }
  const deleted = await bulkDeleteReturns(req.params.id, returnIds);
  return res.json({ deleted });
}

// DELETE /api/companies/:id/returns/:returnId (admin only)
export async function removeReturn(req, res) {
  const removed = await deleteReturn(req.params.returnId, req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Return entry not found.' });
  }
  return res.status(204).send();
}
