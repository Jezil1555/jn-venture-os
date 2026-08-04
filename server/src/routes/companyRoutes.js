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
import { getSales, postSale, postBulkSales, postBulkDeleteSales, removeSale } from '../controllers/salesController.js';
import { getReturns, postReturn, postBulkReturns, postBulkDeleteReturns, removeReturn } from '../controllers/returnsController.js';
import {
  getDistributions,
  postDistribution,
  patchDistribution,
  removeDistribution,
} from '../controllers/distributionsController.js';
import {
  getInvestments,
  postInvestment,
  patchInvestment,
  removeInvestment,
} from '../controllers/investmentsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

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
router.post('/:id/sales/bulk', requireRole('admin'), asyncHandler(postBulkSales));
router.post('/:id/sales/bulk-delete', requireRole('admin'), asyncHandler(postBulkDeleteSales));
router.delete('/:id/sales/:saleId', requireRole('admin'), asyncHandler(removeSale));

router.get('/:id/returns', requireRole('admin'), asyncHandler(getReturns));
router.post('/:id/returns', requireRole('admin'), asyncHandler(postReturn));
router.post('/:id/returns/bulk', requireRole('admin'), asyncHandler(postBulkReturns));
router.post('/:id/returns/bulk-delete', requireRole('admin'), asyncHandler(postBulkDeleteReturns));
router.delete('/:id/returns/:returnId', requireRole('admin'), asyncHandler(removeReturn));

router.get('/:id/distributions', asyncHandler(getDistributions));
router.post('/:id/distributions', requireRole('admin'), asyncHandler(postDistribution));
router.patch('/:id/distributions/:distributionId', requireRole('admin'), asyncHandler(patchDistribution));
router.delete('/:id/distributions/:distributionId', requireRole('admin'), asyncHandler(removeDistribution));

router.get('/:id/investments', asyncHandler(getInvestments));
router.post('/:id/investments', requireRole('admin'), asyncHandler(postInvestment));
router.patch('/:id/investments/:investmentId', requireRole('admin'), asyncHandler(patchInvestment));
router.delete('/:id/investments/:investmentId', requireRole('admin'), asyncHandler(removeInvestment));

export default router;
