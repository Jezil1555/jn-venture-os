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

export default router;
