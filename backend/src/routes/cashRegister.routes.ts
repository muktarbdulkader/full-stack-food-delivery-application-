import { Router } from 'express';
import {
  getActiveRegister,
  openRegister,
  closeRegister,
  getRegisterHistory,
} from '../controllers/cashRegister.controller';
import { protect } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

router.use(protect);
router.use(authorizeRoles('cashier', 'branch_manager', 'restaurant_admin', 'admin', 'super_admin'));

router.get('/active', getActiveRegister);
router.post('/open', openRegister);
router.post('/:id/close', closeRegister);
router.get('/history', getRegisterHistory);

export default router;

