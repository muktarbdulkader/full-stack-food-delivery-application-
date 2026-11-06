import { Router } from 'express';
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receiveGoods,
  getProcurementStats,
} from '../controllers/procurement.controller';
import { protect as authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('super_admin', 'business_owner', 'branch_manager', 'admin', 'procurement_officer'));

// Procurement Stats
router.get('/stats', getProcurementStats);

// Suppliers
router.get('/suppliers', getSuppliers);
router.get('/suppliers/:id', getSupplier);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// Purchase Orders
router.get('/orders', getPurchaseOrders);
router.get('/orders/:id', getPurchaseOrder);
router.post('/orders', createPurchaseOrder);
router.patch('/orders/:id/status', updatePurchaseOrderStatus);
router.post('/orders/:id/receive', receiveGoods);

export default router;

