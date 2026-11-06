import { Router } from 'express';
import {
  staffLogin,
  submitRegistrationRequest,
  acceptInvitation,
  staffLogout,
  refreshAccessToken,
  getStaffMe,
} from '../controllers/staffAuth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public staff auth endpoints
router.post('/login', staffLogin);
router.post('/register-request', submitRegistrationRequest);
router.post('/accept-invitation', acceptInvitation);
router.post('/refresh', refreshAccessToken);

// Protected staff profile & logout
router.get('/me', protect, getStaffMe);
router.post('/logout', protect, staffLogout);

export default router;

