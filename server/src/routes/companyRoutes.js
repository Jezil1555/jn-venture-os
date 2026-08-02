import { Router } from 'express';
import {
  listCompanies,
  getCompany,
  postCompany,
  patchCompany,
  removeCompany,
  getCompanyInvestors,
  putCompanyInvestor,
  deleteCompanyInvestor,
} from '../controllers/companyController.js';
import { getSales, postSale, removeSale } from '../controllers/salesController.js';
import { getReturns, postReturn, removeReturn } from '../controllers/returnsController.js';
import {
  getDistributions,
  postDistribution,
  patchDistribution,
  removeDistribution,
} from '../controllers/distributionsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Every route here requires a logged-in user; the model layer scopes
// results by role (admin sees all, investor sees only their own links).
router.use(requireAuth);

router.get('/', asyncHandler(listCompanies));
router.get('/:id', asyncHandler(getCompany));
router.post('/', requireRole('admin'), asyncHandler(postCompany));
router.patch('/:id', requireRole('admin'), asyncHandler(patchCompany));
router.delete('/:id', requireRole('admin'), asyncHandler(removeCompany));

router.get('/:id/investors', requireRole('admin'), asyncHandler(getCompanyInvestors));
router.put('/:id/investors/:investorId', requireRole('admin'), asyncHandler(putCompanyInvestor));
router.delete('/:id/investors/:investorId', requireRole('admin'), asyncHandler(deleteCompanyInvestor));

router.get('/:id/sales', asyncHandler(getSales));
router.post('/:id/sales', requireRole('admin'), asyncHandler(postSale));
router.delete('/:id/sales/:saleId', requireRole('admin'), asyncHandler(removeSale));

// Returns-received is the internal "money came back to the holding co"
// ledger — admin-only end to end, on purpose.
router.get('/:id/returns', requireRole('admin'), asyncHandler(getReturns));
router.post('/:id/returns', requireRole('admin'), asyncHandler(postReturn));
router.delete('/:id/returns/:returnId', requireRole('admin'), asyncHandler(removeReturn));

// Distributions is "money paid out to a specific investor" — admin
// manages it, investors can view (only their own, enforced in the model).
router.get('/:id/distributions', asyncHandler(getDistributions));
router.post('/:id/distributions', requireRole('admin'), asyncHandler(postDistribution));
router.patch('/:id/distributions/:distributionId', requireRole('admin'), asyncHandler(patchDistribution));
router.delete('/:id/distributions/:distributionId', requireRole('admin'), asyncHandler(removeDistribution));

export default router;
