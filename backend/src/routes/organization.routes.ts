import { Router } from 'express';
import {
  getOrganizationProfile,
  createBranch,
  getBranches,
  getBranchDashboardStats,
} from '../controllers/organization.controller';
import { protect, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.get('/branches', getBranches);
router.get('/profile', protect, getOrganizationProfile);
router.post('/branches', protect, adminOnly, createBranch);
router.get('/branches/:branchId/stats', protect, getBranchDashboardStats);

export default router;

