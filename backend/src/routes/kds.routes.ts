import { Router } from 'express';
import {
  getKitchenOrders,
  getKitchenOrder,
  startPreparation,
  markItemReady,
  markOrderReady,
  markOrderServed,
  cancelKitchenOrder,
  getKitchenStats,
} from '../controllers/kds.controller';
import { protect as authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

// All KDS routes require authentication + kitchen/admin/manager role
router.use(authenticate);
router.use(authorizeRoles('super_admin', 'business_owner', 'branch_manager', 'admin', 'chef', 'kitchen_staff'));

router.get('/orders', getKitchenOrders);
router.get('/stats', getKitchenStats);
router.get('/orders/:id', getKitchenOrder);

router.patch('/orders/:id/start', startPreparation);
router.patch('/orders/:id/ready', markOrderReady);
router.patch('/orders/:id/served', markOrderServed);
router.patch('/orders/:id/cancel', cancelKitchenOrder);
router.patch('/orders/:id/items/:itemIndex/ready', markItemReady);

export default router;
