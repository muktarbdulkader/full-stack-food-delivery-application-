import { Response, NextFunction } from 'express';
import { Organization } from '../models/Organization.model';
import { Branch } from '../models/Branch.model';
import { RestaurantTable } from '../models/RestaurantTable.model';
import { Order } from '../models/Order.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';

export const getOrganizationProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let org = await Organization.findOne({ isActive: true });
    if (!org) {
      org = await Organization.create({
        name: 'FoodHub Ethiopia',
        slug: 'foodhub-ethiopia',
        contactEmail: 'admin@foodhub.et',
        contactPhone: '+251 911 234 567',
        businessType: 'chain',
        address: { city: 'Addis Ababa', country: 'Ethiopia' },
      });
    }

    const branches = await Branch.find({ organizationId: org._id, isActive: true });

    res.status(200).json({
      status: 'success',
      data: {
        organization: org,
        branches,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createBranch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, code, phone, email, address, operatingHours, diningAreas } = req.body;

    let org = await Organization.findOne({ isActive: true });
    if (!org) {
      org = await Organization.create({
        name: 'FoodHub Ethiopia',
        slug: 'foodhub-ethiopia',
        contactEmail: 'admin@foodhub.et',
        contactPhone: '+251 911 234 567',
      });
    }

    const existingBranch = await Branch.findOne({ organizationId: org._id, code });
    if (existingBranch) {
      throw createError(`Branch with code ${code} already exists`, 400);
    }

    const branch = await Branch.create({
      organizationId: org._id,
      name,
      code,
      phone,
      email,
      address,
      operatingHours,
      diningAreas: diningAreas || ['Main Hall', 'VIP Section', 'Patio'],
    });

    res.status(201).json({
      status: 'success',
      message: `Branch '${name}' created successfully`,
      data: { branch },
    });
  } catch (error) {
    next(error);
  }
};

export const getBranches = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ isMainBranch: -1, name: 1 });
    res.status(200).json({
      status: 'success',
      results: branches.length,
      data: { branches },
    });
  } catch (error) {
    next(error);
  }
};

export const getBranchDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId);
    if (!branch) throw createError('Branch not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalTables,
      occupiedTables,
      availableTables,
      todayOrders,
      todayRevenueResult,
      activeDineInSessions,
    ] = await Promise.all([
      RestaurantTable.countDocuments({ branchId, isActive: true }),
      RestaurantTable.countDocuments({ branchId, status: { $in: ['occupied', 'waiting_for_food', 'waiting_for_payment'] }, isActive: true }),
      RestaurantTable.countDocuments({ branchId, status: 'available', isActive: true }),
      Order.countDocuments({ branchId, createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { branchId: branch._id, createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      RestaurantTable.countDocuments({ branchId, currentSessionId: { $exists: true } }),
    ]);

    const todayRevenue = todayRevenueResult[0]?.total || 0;

    res.status(200).json({
      status: 'success',
      data: {
        branch: { id: branch._id, name: branch.name, code: branch.code },
        tables: {
          total: totalTables,
          occupied: occupiedTables,
          available: availableTables,
          activeSessions: activeDineInSessions,
        },
        orders: {
          todayCount: todayOrders,
          todayRevenue,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

