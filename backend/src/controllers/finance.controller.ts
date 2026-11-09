import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Account } from '../models/Account.model';
import { JournalEntry } from '../models/JournalEntry.model';
import { createError } from '../middlewares/error.middleware';

// ─── Initialize Default Chart of Accounts ──────────────────────────────────
export const initChartOfAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { organizationId, branchId } = req.body;
    const defaultAccounts = [
      { code: '1010', name: 'Cash on Hand', category: 'asset' },
      { code: '1020', name: 'Bank Account (Telebirr/CBE)', category: 'asset' },
      { code: '1030', name: 'Raw Material Inventory Asset', category: 'asset' },
      { code: '2010', name: 'Accounts Payable (Vendors)', category: 'liability' },
      { code: '2020', name: 'Accrued Payroll & Benefits', category: 'liability' },
      { code: '3010', name: 'Owner Equity & Retained Earnings', category: 'equity' },
      { code: '4010', name: 'Food & Beverage Dine-In Revenue', category: 'revenue' },
      { code: '4020', name: 'Online Delivery Sales Revenue', category: 'revenue' },
      { code: '5010', name: 'Cost of Goods Sold (Ingredients)', category: 'expense' },
      { code: '5020', name: 'Staff Salaries & Wages', category: 'expense' },
      { code: '5030', name: 'Kitchen & Operating Utilities', category: 'expense' },
    ];

    const created = [];
    for (const acc of defaultAccounts) {
      const exists = await Account.findOne({ code: acc.code, branchId: branchId || undefined });
      if (!exists) {
        const doc = await Account.create({
          ...acc,
          organizationId,
          branchId,
          isSystemAccount: true,
        });
        created.push(doc);
      }
    }

    res.status(200).json({ status: 'success', message: `Initialized ${created.length} accounts`, data: { created } });
  } catch (error) { next(error); }
};

// ─── Get Chart of Accounts ─────────────────────────────────────────────────
export const getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, category } = req.query;
    const filter: Record<string, any> = { isActive: true };
    const user = (req as any).user;
    if (user?.role !== 'super_admin' && user?.organizationId) {
      filter.organizationId = user.organizationId;
    }
    if (branchId) filter.branchId = branchId;
    if (category) filter.category = category;

    const accounts = await Account.find(filter).sort({ code: 1 }).lean();
    res.status(200).json({ status: 'success', data: { accounts } });
  } catch (error) { next(error); }
};

// ─── Create Account ────────────────────────────────────────────────────────
export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const account = await Account.create(req.body);
    res.status(201).json({ status: 'success', data: { account } });
  } catch (error) { next(error); }
};

// ─── Post Journal Entry (Double-Entry Balance Enforced) ─────────────────────
export const createJournalEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { lines, notes, referenceType, referenceId, branchId, organizationId } = req.body;
    if (!lines || !Array.isArray(lines) || lines.length < 2) {
      throw createError('Journal entry requires at least 2 balanced line items', 400);
    }

    const totalDebit = lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0);

    // Double entry validation
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw createError(`Unbalanced entry: Debits (ETB ${totalDebit}) must equal Credits (ETB ${totalCredit})`, 400);
    }

    const entryNumber = `JE-${Date.now().toString(36).toUpperCase()}`;

    // Update account balances atomically
    for (const line of lines) {
      const acc = await Account.findById(line.account).session(session);
      if (!acc) throw createError(`Account not found: ${line.account}`, 404);

      line.accountCode = acc.code;
      line.accountName = acc.name;

      // Assets/Expenses increase with Debit; Liabilities/Equity/Revenue increase with Credit
      if (['asset', 'expense'].includes(acc.category)) {
        acc.balance += (Number(line.debit) || 0) - (Number(line.credit) || 0);
      } else {
        acc.balance += (Number(line.credit) || 0) - (Number(line.debit) || 0);
      }
      await acc.save({ session });
    }

    const entry = await JournalEntry.create(
      [
        {
          entryNumber,
          organizationId,
          branchId,
          lines,
          totalDebit,
          totalCredit,
          notes,
          referenceType,
          referenceId,
          createdBy: (req as any).user?._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ status: 'success', data: { entry: entry[0] } });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─── Get Journal Entries ───────────────────────────────────────────────────
export const getJournalEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, page = '1', limit = '30' } = req.query;
    const filter: Record<string, any> = {};
    const user = (req as any).user;
    if (user?.role !== 'super_admin' && user?.organizationId) {
      filter.organizationId = user.organizationId;
    }
    if (branchId) filter.branchId = branchId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [entries, total] = await Promise.all([
      JournalEntry.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      JournalEntry.countDocuments(filter),
    ]);

    res.status(200).json({ status: 'success', data: { entries, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) } } });
  } catch (error) { next(error); }
};

// ─── Financial P&L (Profit & Loss Statement) ──────────────────────────────
export const getProfitAndLoss = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.query;
    const filter: Record<string, any> = { isActive: true };
    const user = (req as any).user;
    if (user?.role !== 'super_admin' && user?.organizationId) {
      filter.organizationId = user.organizationId;
    }
    if (branchId) filter.branchId = branchId;

    const [revenueAccounts, expenseAccounts] = await Promise.all([
      Account.find({ ...filter, category: 'revenue' }).lean(),
      Account.find({ ...filter, category: 'expense' }).lean(),
    ]);

    const totalRevenue = revenueAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalExpenses = expenseAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    res.status(200).json({
      status: 'success',
      data: {
        statement: {
          revenues: revenueAccounts,
          totalRevenue,
          expenses: expenseAccounts,
          totalExpenses,
          netIncome,
        },
      },
    });
  } catch (error) { next(error); }
};

