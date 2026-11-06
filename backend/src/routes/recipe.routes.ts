import { Router } from 'express';
import {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  recalculateRecipeCost,
  getRecipeCostSummary,
} from '../controllers/recipe.controller';
import { protect as authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('super_admin', 'business_owner', 'branch_manager', 'admin', 'inventory_manager', 'chef'));

router.get('/summary', getRecipeCostSummary);
router.get('/', getRecipes);
router.get('/:id', getRecipe);

router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);
router.post('/:id/recalculate', recalculateRecipeCost);

export default router;

