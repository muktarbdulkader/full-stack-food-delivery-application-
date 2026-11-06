import { Router } from 'express';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  clockIn,
  clockOut,
  getAttendanceRecords,
  generatePayroll,
  getPayrollRuns,
  markPayrollPaid,
} from '../controllers/hr.controller';
import { protect as authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('super_admin', 'business_owner', 'branch_manager', 'admin', 'hr_manager', 'accountant'));

// Employees
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Attendance
router.post('/attendance/clock-in', clockIn);
router.post('/attendance/clock-out', clockOut);
router.get('/attendance', getAttendanceRecords);

// Payroll
router.post('/payroll/generate', generatePayroll);
router.get('/payroll', getPayrollRuns);
router.patch('/payroll/:id/pay', markPayrollPaid);

export default router;

