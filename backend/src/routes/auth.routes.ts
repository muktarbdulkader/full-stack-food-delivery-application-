import { Router } from 'express';
import { register, registerAdmin, login, adminLogin, getMe } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);

export default router;
