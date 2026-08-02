import { getCompanyByIdForUser } from '../models/companyModel.js';
import { listSalesForCompany, createSale, deleteSale, totalSalesForCompany } from '../models/salesModel.js';

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

// DELETE /api/companies/:id/sales/:saleId (admin only)
export async function removeSale(req, res) {
  const removed = await deleteSale(req.params.saleId, req.params.id);
  if (!removed) {
    return res.status(404).json({ error: 'Sale entry not found.' });
  }
  return res.status(204).send();
}
