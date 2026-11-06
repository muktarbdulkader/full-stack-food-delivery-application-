import { Router } from 'express';
import {
  getDeliveries,
  getAvailableDrivers,
  assignDriver,
  updateDeliveryStatus,
} from '../controllers/deliveryDispatch.controller';
import { protect } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

router.use(protect);
router.use(
  authorizeRoles('driver', 'delivery_manager', 'branch_manager', 'restaurant_admin', 'admin', 'super_admin')
);

router.get('/', getDeliveries);
router.get('/drivers', getAvailableDrivers);
router.post('/assign', assignDriver);
router.put('/:id/status', updateDeliveryStatus);

export default router;

