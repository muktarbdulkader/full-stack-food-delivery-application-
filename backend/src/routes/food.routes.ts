import { Router } from 'express';
import {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} from '../controllers/food.controller';
import { protect, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getAllFoods);
router.get('/:id', getFoodById);
router.post('/', protect, adminOnly, createFood);
router.put('/:id', protect, adminOnly, updateFood);
router.delete('/:id', protect, adminOnly, deleteFood);

export default router;
