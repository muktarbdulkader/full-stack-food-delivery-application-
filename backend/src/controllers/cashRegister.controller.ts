import { Response, NextFunction } from 'express';
import { CashRegister } from '../models/CashRegister.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { AuditLog } from '../models/AuditLog.model';

/**
 * Get active cash register for cashier
 */
export const getActiveRegister = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cashierId = req.user!._id;
    const register = await CashRegister.findOne({
      cashierId,
      status: 'open',
    }).sort({ openedAt: -1 });

    res.json({ success: true, register });
  } catch (error) {
    next(error);
  }
};

/**
 * Open cash drawer / register session
 */
export const openRegister = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cashierId = req.user!._id;
    const { openingBalance } = req.body;

    if (openingBalance === undefined || openingBalance < 0) {
      throw createError('Valid opening balance required', 400);
    }

    // Check if one is already open
    const existing = await CashRegister.findOne({ cashierId, status: 'open' });
    if (existing) {
      throw createError('You already have an open cash register session', 400);
    }

    const register = await CashRegister.create({
      cashierId,
      cashierName: req.user!.name,
      branchId: (req.user as any).branchId,
      organizationId: (req.user as any).organizationId,
      openingBalance: Number(openingBalance),
      expectedClosingBalance: Number(openingBalance),
      status: 'open',
      openedAt: new Date(),
    });

    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CASH_REGISTER_OPENED',
      entityType: 'CashRegister',
      entityId: register._id.toString(),
      details: { openingBalance },
    });

    res.status(201).json({ success: true, register });
  } catch (error) {
    next(error);
  }
};

/**
 * Close cash drawer / reconcile
 */
export const closeRegister = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { closingBalance, discrepancyNote } = req.body;

    const register = await CashRegister.findById(id);
    if (!register) throw createError('Register session not found', 404);
    if (register.status === 'closed') throw createError('Register session already closed', 400);

    const expected = (register.openingBalance || 0) + (register.totalCashSales || 0) - (register.totalRefunds || 0);

    register.closingBalance = Number(closingBalance);
    register.expectedClosingBalance = expected;
    register.discrepancyNote = discrepancyNote;
    register.status = 'closed';
    register.closedAt = new Date();

    await register.save();

    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'CASH_REGISTER_CLOSED',
      entityType: 'CashRegister',
      entityId: register._id.toString(),
      details: {
        openingBalance: register.openingBalance,
        closingBalance: register.closingBalance,
        expected,
        difference: Number(closingBalance) - expected,
      },
    });

    res.json({
      success: true,
      message: 'Cash register closed and reconciled',
      register,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get register sessions history
 */
export const getRegisterHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, limit = '30' } = req.query;
    const query: Record<string, any> = {};
    if (branchId) query.branchId = branchId;

    const registers = await CashRegister.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10));

    res.json({ success: true, registers });
  } catch (error) {
    next(error);
  }
};

