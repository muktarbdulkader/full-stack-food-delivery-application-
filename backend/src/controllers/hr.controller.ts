import { Request, Response, NextFunction } from 'express';
import { Employee } from '../models/Employee.model';
import { Attendance } from '../models/Attendance.model';
import { PayrollRun } from '../models/PayrollRun.model';
import { createError } from '../middlewares/error.middleware';

// ══════════════════════════════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════════════════════════════

export const getEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, role, search } = req.query;
    const filter: Record<string, any> = { isActive: true };
    if (branchId) filter.branchId = branchId;
    if (role) filter.role = role;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const employees = await Employee.find(filter).sort({ name: 1 }).lean();
    res.status(200).json({ status: 'success', data: { employees } });
  } catch (error) { next(error); }
};

export const createEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await Employee.countDocuments();
    const employeeCode = `EMP-${(count + 1).toString().padStart(3, '0')}`;
    const employee = await Employee.create({ ...req.body, employeeCode });
    res.status(201).json({ status: 'success', data: { employee } });
  } catch (error) { next(error); }
};

export const updateEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!employee) throw createError('Employee not found', 404);
    res.status(200).json({ status: 'success', data: { employee } });
  } catch (error) { next(error); }
};

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!employee) throw createError('Employee not found', 404);
    res.status(200).json({ status: 'success', message: 'Employee deactivated' });
  } catch (error) { next(error); }
};

// ══════════════════════════════════════════════════════════
// ATTENDANCE (Clock In / Clock Out)
// ══════════════════════════════════════════════════════════

export const clockIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { employeeId, notes } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) throw createError('Employee not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existing = await Attendance.findOne({ employee: employeeId, date: today });
    if (existing) {
      throw createError('Employee already clocked in today', 400);
    }

    const attendance = await Attendance.create({
      organizationId: employee.organizationId,
      branchId: employee.branchId,
      employee: employeeId,
      date: today,
      clockIn: new Date(),
      status: 'present',
      notes,
    });

    res.status(201).json({ status: 'success', message: 'Clocked in successfully', data: { attendance } });
  } catch (error) { next(error); }
};

export const clockOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance) throw createError('No clock-in record found for today', 404);
    if (attendance.clockOut) throw createError('Already clocked out today', 400);

    const clockOutTime = new Date();
    const hours = (clockOutTime.getTime() - attendance.clockIn.getTime()) / (1000 * 60 * 60);

    attendance.clockOut = clockOutTime;
    attendance.totalHoursWorked = parseFloat(hours.toFixed(2));
    await attendance.save();

    res.status(200).json({ status: 'success', message: `Clocked out. Worked ${attendance.totalHoursWorked} hours`, data: { attendance } });
  } catch (error) { next(error); }
};

export const getAttendanceRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, date } = req.query;
    const filter: Record<string, any> = {};
    if (branchId) filter.branchId = branchId;
    if (date) {
      const d = new Date(date as string);
      d.setHours(0, 0, 0, 0);
      filter.date = d;
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'name employeeCode role')
      .sort({ clockIn: -1 })
      .lean();

    res.status(200).json({ status: 'success', data: { records } });
  } catch (error) { next(error); }
};

// ══════════════════════════════════════════════════════════
// PAYROLL RUNS
// ══════════════════════════════════════════════════════════

export const generatePayroll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, branchId, organizationId } = req.body; // month format "YYYY-MM"
    if (!month) throw createError('Month is required (YYYY-MM)', 400);

    const filter: Record<string, any> = { isActive: true };
    if (branchId) filter.branchId = branchId;

    const employees = await Employee.find(filter).lean();
    if (employees.length === 0) throw createError('No active employees found to generate payroll', 400);

    const items = employees.map((emp) => {
      const baseSalary = emp.baseSalary || 0;
      const deductions = Math.round(baseSalary * 0.05); // standard 5% pension deduction
      const netPay = baseSalary - deductions;
      return {
        employee: emp._id as any,
        employeeCode: emp.employeeCode,
        name: emp.name,
        baseSalary,
        bonus: 0,
        deductions,
        netPay,
        paymentStatus: 'pending' as const,
      };
    });

    const totalGross = items.reduce((s, i) => s + i.baseSalary, 0);
    const totalDeductions = items.reduce((s, i) => s + i.deductions, 0);
    const totalNet = items.reduce((s, i) => s + i.netPay, 0);

    const payroll = await PayrollRun.create({
      organizationId,
      branchId,
      month,
      items,
      totalGross,
      totalDeductions,
      totalNet,
      status: 'draft',
    });

    res.status(201).json({ status: 'success', data: { payroll } });
  } catch (error) { next(error); }
};

export const getPayrollRuns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.query;
    const filter: Record<string, any> = {};
    if (branchId) filter.branchId = branchId;

    const payrolls = await PayrollRun.find(filter).sort({ month: -1 }).lean();
    res.status(200).json({ status: 'success', data: { payrolls } });
  } catch (error) { next(error); }
};

export const markPayrollPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payroll = await PayrollRun.findById(req.params.id);
    if (!payroll) throw createError('Payroll run not found', 404);

    payroll.status = 'paid';
    payroll.items.forEach((item) => {
      item.paymentStatus = 'paid';
      item.paidAt = new Date();
    });
    await payroll.save();

    res.status(200).json({ status: 'success', message: 'Payroll marked as paid in full', data: { payroll } });
  } catch (error) { next(error); }
};

