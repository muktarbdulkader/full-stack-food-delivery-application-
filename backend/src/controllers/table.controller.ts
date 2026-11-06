import { Request, Response, NextFunction } from 'express';
import { RestaurantTable } from '../models/RestaurantTable.model';
import { TableSession } from '../models/TableSession.model';
import { Branch } from '../models/Branch.model';
import { createError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { generateSecureQRToken, generateTableQRCodeDataUrl } from '../services/qr.service';
import { AuditLog } from '../models/AuditLog.model';
import { emitTableStatusUpdate } from '../services/socket.service';

export const getAllTables = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, area, status } = req.query;
    const filter: Record<string, any> = { isActive: true };

    if (branchId) filter.branchId = branchId;
    if (area) filter.diningArea = area;
    if (status) filter.status = status;

    const tables = await RestaurantTable.find(filter)
      .populate('branchId', 'name code')
      .populate('currentSessionId')
      .sort({ diningArea: 1, tableNumber: 1 });

    res.status(200).json({
      status: 'success',
      results: tables.length,
      data: { tables },
    });
  } catch (error) {
    next(error);
  }
};

export const getTableById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const table = await RestaurantTable.findById(id)
      .populate('branchId', 'name code diningAreas')
      .populate({
        path: 'currentSessionId',
        populate: {
          path: 'orders',
          populate: { path: 'items.food', select: 'name price image' },
        },
      });

    if (!table || !table.isActive) {
      throw createError('Table not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

export const createTable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, tableNumber, name, diningArea, capacity, notes } = req.body;

    if (!branchId || !tableNumber || !name) {
      throw createError('Branch ID, Table Number, and Name are required', 400);
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw createError('Branch not found', 404);
    }

    const existingTable = await RestaurantTable.findOne({
      branchId,
      tableNumber,
      isActive: true,
    });
    if (existingTable) {
      throw createError(`Table #${tableNumber} already exists in this branch`, 400);
    }

    // Generate secure QR token & QR data URL
    const qrToken = generateSecureQRToken();
    const qrCodeUrl = await generateTableQRCodeDataUrl(qrToken);

    const table = await RestaurantTable.create({
      organizationId: branch.organizationId,
      branchId,
      tableNumber,
      name,
      diningArea: diningArea || 'Main Dining',
      capacity: capacity || 4,
      status: 'available',
      qrToken,
      qrCodeUrl,
      notes,
    });

    await AuditLog.create({
      organizationId: branch.organizationId,
      branchId,
      userId: req.user?._id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'TABLE_CREATED',
      entityType: 'RestaurantTable',
      entityId: table._id.toString(),
      details: { tableNumber, diningArea, capacity },
    });

    res.status(201).json({
      status: 'success',
      message: `Table #${tableNumber} registered successfully`,
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, diningArea, capacity, status, notes } = req.body;

    const table = await RestaurantTable.findById(id);
    if (!table || !table.isActive) {
      throw createError('Table not found', 404);
    }

    if (name) table.name = name;
    if (diningArea) table.diningArea = diningArea;
    if (capacity) table.capacity = capacity;
    if (notes !== undefined) table.notes = notes;

    // Check status override
    if (status && status !== table.status) {
      // Validate: do not allow marking available if active session with unpaid balance exists
      if (status === 'available' && table.currentSessionId) {
        const session = await TableSession.findById(table.currentSessionId);
        if (session && session.status === 'active' && session.paymentStatus !== 'paid' && session.totalAmount > 0) {
          throw createError('Cannot mark table available while an unpaid dining session is active', 400);
        }
      }
      table.status = status;
      emitTableStatusUpdate(table.branchId.toString(), table._id.toString(), status);
    }

    await table.save();

    await AuditLog.create({
      organizationId: table.organizationId,
      branchId: table.branchId,
      userId: req.user?._id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'TABLE_UPDATED',
      entityType: 'RestaurantTable',
      entityId: table._id.toString(),
      details: { name, diningArea, capacity, status },
    });

    res.status(200).json({
      status: 'success',
      data: { table },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const table = await RestaurantTable.findById(id);
    if (!table) throw createError('Table not found', 404);

    table.isActive = false;
    await table.save();

    await AuditLog.create({
      organizationId: table.organizationId,
      branchId: table.branchId,
      userId: req.user?._id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'TABLE_DELETED',
      entityType: 'RestaurantTable',
      entityId: table._id.toString(),
    });

    res.status(200).json({
      status: 'success',
      message: 'Table deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateQRCode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const table = await RestaurantTable.findById(id);
    if (!table || !table.isActive) throw createError('Table not found', 404);

    const newQrToken = generateSecureQRToken();
    const newQrCodeUrl = await generateTableQRCodeDataUrl(newQrToken);

    table.qrToken = newQrToken;
    table.qrCodeUrl = newQrCodeUrl;
    await table.save();

    res.status(200).json({
      status: 'success',
      message: 'New QR code generated successfully',
      data: {
        tableId: table._id,
        tableNumber: table.tableNumber,
        qrToken: newQrToken,
        qrCodeUrl: newQrCodeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

