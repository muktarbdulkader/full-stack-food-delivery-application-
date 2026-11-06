import { Router } from 'express';
import {
  getWaiterRequests,
  updateWaiterRequestStatus,
} from '../controllers/waiter-request.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getWaiterRequests);
router.patch('/:id/status', updateWaiterRequestStatus);

export default router;

