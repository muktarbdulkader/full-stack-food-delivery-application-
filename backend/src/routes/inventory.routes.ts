import { Router } from 'express';
import {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  stockIn,
  stockOut,
  adjustStock,
  getStockMovements,
  getInventoryStats,
} from '../controllers/inventory.controller';
import { protect as authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('super_admin', 'business_owner', 'branch_manager', 'admin', 'inventory_manager', 'chef'));

router.get('/ingredients', getIngredients);
router.get('/stats', getInventoryStats);
router.get('/movements', getStockMovements);
router.get('/ingredients/:id', getIngredient);

router.post('/ingredients', createIngredient);
router.put('/ingredients/:id', updateIngredient);
router.delete('/ingredients/:id', deleteIngredient);

router.post('/ingredients/:id/stock-in', stockIn);
router.post('/ingredients/:id/stock-out', stockOut);
router.post('/ingredients/:id/adjust', adjustStock);

export default router;

