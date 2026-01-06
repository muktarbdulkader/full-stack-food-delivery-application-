import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getRevenueAnalytics,
  confirmPayment,
  assignDriver,
  getOrderDetails,
} from '../controllers/admin.controller';
import { protect, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/analytics', getRevenueAnalytics);
router.post('/orders/:orderId/confirm-payment', confirmPayment);
router.post('/orders/:orderId/assign-driver', assignDriver);
router.get('/orders/:orderId', getOrderDetails);

export default router;
