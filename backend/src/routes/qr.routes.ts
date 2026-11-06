import { Router } from 'express';
import {
  resolveQRScan,
  placeDineInOrder,
  callWaiter,
  getTableBill,
  requestBill,
} from '../controllers/qr-ordering.controller';

const router = Router();

// Public dine-in customer routes (secured via unpredictable cryptographic QR token)
router.get('/scan/:qrToken', resolveQRScan);
router.post('/order', placeDineInOrder);
router.post('/call-waiter', callWaiter);
router.get('/bill/:qrToken', getTableBill);
router.post('/request-bill', requestBill);

export default router;

