import { Router } from 'express';
import {
  getStaffList,
  inviteStaff,
  createStaffDirect,
  updateStaffMember,
  revokeStaffSessions,
  getRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  getInvitations,
  revokeInvitation,
  getStaffActivityLogs,
} from '../controllers/staffAdmin.controller';
import { protect } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

// Protect all admin staff management routes
router.use(protect);
router.use(authorizeRoles('admin', 'super_admin', 'business_owner', 'branch_manager'));

// Staff Directory
router.get('/', getStaffList);
router.post('/direct', createStaffDirect);
router.post('/invite', inviteStaff);
router.put('/:id', updateStaffMember);
router.post('/:id/revoke-sessions', revokeStaffSessions);

// Registration Requests
router.get('/requests/list', getRegistrationRequests);
router.post('/requests/:id/approve', approveRegistrationRequest);
router.post('/requests/:id/reject', rejectRegistrationRequest);

// Invitations
router.get('/invitations/list', getInvitations);
router.post('/invitations/:id/revoke', revokeInvitation);

// Activity Logs
router.get('/activity/logs', getStaffActivityLogs);

export default router;

