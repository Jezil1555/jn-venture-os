import { getCompanyByIdForUser } from '../models/companyModel.js';
import {
  listSalesForCompany,
  createSale,
  deleteSale,
  totalSalesForCompany,
  bulkCreateSales,
  bulkDeleteSales,
} from '../models/salesModel.js';

const MAX_BULK_ROWS = 5000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Sales are viewed through the same lens as the company itself: admins see
// any company's sales, investors only see sales for a company they're
// actually linked to. We reuse getCompanyByIdForUser as the access check
// so this can never drift out of sync with company visibility rules.
async function assertCanViewCompany(companyId, user) {
  const company = await getCompanyByIdForUser(companyId, user);
  if (!company) {
    const err = new Error('Company not found, or you do not have access to it.');
    err.status = 404;
    throw err;
  }
  return company;
}

// GET /api/companies/:id/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function getSales(req, res) {
  await assertCanViewCompany(req.params.id, req.user);
  const { from, to } = req.query;
  const [sales, total] = await Promise.all([
    listSalesForCompany(req.params.id, { from, to }),
    totalSalesForCompany(req.params.id, { from, to }),
  ]);
  return res.json({ sales, total });
}

// POST /api/companies/:id/sales (admin only, enforced by route middleware)
export async function postSale(req, res) {
  const { saleDate, amount, notes } = req.body;

  if (!saleDate || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Sale date and amount are required.' });
  }
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return res.status(400).json({ error: 'Amount must be a number.' });
  }

  // Confirm the company exists before attaching a sale to it.
  await assertCanViewCompany(req.params.id, req.user);

  const sale = await createSale({
    companyId: req.params.id,
    saleDate,
    amount: numericAmount,
    notes,
    createdBy: req.user.id,
  });
  return res.status(201).json({ sale });
}

// POST /api/companies/:id/sales/bulk (admin only)
// Body: { sales: [{ saleDate: 'YYYY-MM-DD', amount: number, notes?: string }, ...] }
// The client is expected to have already parsed and validated the
// spreadsheet — this endpoint re-validates anyway, since a client bug or
// a hand-crafted request shouldn't be able to write bad rows.
export async function postBulkSales(req, res) {
  const { sales } = req.body;

  if (!Array.isArray(sales) || sales.length === 0) {
    return res.status(400).json({ error: 'No rows to import.' });
  }
  if (sales.length > MAX_BULK_ROWS) {
    return res.status(400).json({ error: `Cannot import more than ${MAX_BULK_ROWS} rows at once.` });
  }

  const cleanRows = [];
  const rowErrors = [];

  sales.forEach((row, index) => {
    const lineNo = index + 1;
    if (!row || typeof row !== 'object') {
      rowErrors.push({ row: lineNo, error: 'Malformed row.' });
      return;
    }
    if (!DATE_RE.test(row.saleDate)) {
      rowErrors.push({ row: lineNo, error: 'Date must be in YYYY-MM-DD format.' });
      return;
    }
    const amount = Number(row.amount);
    if (Number.isNaN(amount) || amount < 0) {
      rowErrors.push({ row: lineNo, error: 'Amount must be a non-negative number.' });
      return;
    }
    cleanRows.push({ saleDate: row.saleDate, amount, notes: row.notes ? String(row.notes).slice(0, 500) : null });
  });

  if (rowErrors.length > 0) {
    return res.status(400).json({ error: 'Some rows failed validation.', rowErrors });
  }

  await assertCanViewCompany(req.params.id, req.user);

  const inserted = await bulkCreateSales(req.params.id, cleanRows, req.user.id);
  return res.status(201).json({ inserted });
}

// POST /api/companies/:id/sales/bulk-delete (admin only)
// Body: { saleIds: [...] }. Using POST rather than DELETE-with-a-body
// avoids relying on clients/proxies that strip bodies from DELETE requests.
const MAX_BULK_DELETE = 5000;

export async function postBulkDeleteSales(req, res) {
  const { saleIds } = req.body;

  if (!Array.isArray(saleIds) || saleIds.length === 0) {
    return res.status(400).json({ error: 'No rows selected.' });
  }
  if (saleIds.length > MAX_BULK_DELETE) {
    return res.status(400).json({ error: `Cannot delete more than ${MAX_BULK_DELETE} rows at once.` });
  }

  await assertCanViewCompany(req.params.id, req.user);

  const deleted = await bulkDeleteSales(req.params.id, saleIds);
  return res.json({ deleted });
}

// DELETE /api/companies/:id/sales/:saleId (admin only)
export async function removeSale(req, res) {
  const removed = await deleteSale(req.params.saleId, req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Sale entry not found.' });
  }
  return res.status(204).send();
}
