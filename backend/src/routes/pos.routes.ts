import { Router } from 'express';
import {
  createPosSale,
  getPosSales,
  getPosStats,
  processRefund,
  getPOSTables,
} from '../controllers/pos.controller';
import { protect as authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('super_admin', 'business_owner', 'branch_manager', 'admin', 'cashier', 'waiter'));

router.post('/sale', createPosSale);
router.get('/sales', getPosSales);
router.get('/stats', getPosStats);
router.get('/tables', getPOSTables);
router.patch('/sales/:id/refund', processRefund);

export default router;
