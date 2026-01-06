import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  processPayment,
} from '../controllers/order.controller';
import { protect, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, createOrder);
router.post('/payment', protect, processPayment);
router.get('/my-orders', protect, getMyOrders);
router.get('/all', protect, adminOnly, getAllOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
