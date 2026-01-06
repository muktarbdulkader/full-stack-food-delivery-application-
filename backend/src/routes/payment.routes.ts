import { Router } from 'express';
import {
  initiatePayment,
  mpesaCallback,
  telebirrCallback,
  cbeBirrCallback,
  checkPaymentStatus,
} from '../controllers/payment.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Protected routes
router.post('/initiate', protect, initiatePayment);
router.get('/status/:orderId', protect, checkPaymentStatus);

// Payment callbacks (public - called by payment providers)
router.post('/mpesa/callback', mpesaCallback);
router.post('/telebirr/callback', telebirrCallback);
router.post('/cbebirr/callback', cbeBirrCallback);

export default router;
