import { Response, NextFunction } from 'express';
import { DeliveryAssignment } from '../models/DeliveryAssignment.model';
import { Order } from '../models/Order.model';
import { User } from '../models/User.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';
import { AuditLog } from '../models/AuditLog.model';

/**
 * Get delivery assignments
 * Dispatcher / Admin gets all; Driver gets only their own assigned deliveries
 */
export const getDeliveries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user!;
    const { status } = req.query;
    const query: Record<string, any> = {};

    if (user.role === 'driver') {
      // Driver isolation: Driver only sees what is assigned to them
      query.driverId = user._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const assignments = await DeliveryAssignment.find(query)
      .populate('orderId')
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available drivers for dispatch assignment
 */
export const getAvailableDrivers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const drivers = await User.find({
      role: 'driver',
      isActive: true,
      registrationStatus: 'active',
    }).select('name email phone employeeId');

    res.json({ success: true, drivers });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign or reassign driver to order
 */
export const assignDriver = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, driverId, deliveryAddress, customerName, customerPhone, deliveryNotes } = req.body;

    if (!orderId || !driverId) {
      throw createError('Order ID and Driver ID are required', 400);
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      throw createError('Selected user is not an active driver', 400);
    }

    let assignment = await DeliveryAssignment.findOne({ orderId });

    if (assignment) {
      assignment.driverId = driver._id;
      assignment.driverName = driver.name;
      assignment.driverPhone = driver.phone;
      assignment.dispatcherId = req.user!._id;
      assignment.dispatcherName = req.user!.name;
      assignment.status = 'assigned';
      assignment.assignedAt = new Date();
      if (deliveryNotes) assignment.deliveryNotes = deliveryNotes;
      await assignment.save();
    } else {
      assignment = await DeliveryAssignment.create({
        orderId,
        driverId: driver._id,
        driverName: driver.name,
        driverPhone: driver.phone,
        dispatcherId: req.user!._id,
        dispatcherName: req.user!.name,
        branchId: (req.user as any).branchId,
        organizationId: (req.user as any).organizationId,
        deliveryAddress: deliveryAddress || 'Address on file',
        customerName: customerName || 'Customer',
        customerPhone,
        status: 'assigned',
        assignedAt: new Date(),
        deliveryNotes,
      });
    }

    // Update order status if needed
    await Order.findByIdAndUpdate(orderId, { status: 'out_for_delivery' });

    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'DELIVERY_ASSIGNED',
      entityType: 'DeliveryAssignment',
      entityId: assignment._id.toString(),
      details: { driverName: driver.name, orderId },
    });

    res.json({
      success: true,
      message: `Delivery assigned to ${driver.name}`,
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Driver updates delivery status (accept, pickup, delivered, failed)
 */
export const updateDeliveryStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, failureReason } = req.body;
    const user = req.user!;

    const assignment = await DeliveryAssignment.findById(id);
    if (!assignment) throw createError('Delivery assignment not found', 404);

    // If role is driver, enforce driver isolation
    if (user.role === 'driver' && assignment.driverId?.toString() !== user._id.toString()) {
      throw createError('Access denied: You are not assigned to this delivery', 403);
    }

    assignment.status = status;

    if (status === 'accepted') {
      assignment.acceptedAt = new Date();
    } else if (status === 'picked_up' || status === 'in_transit') {
      assignment.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      assignment.deliveredAt = new Date();
      await Order.findByIdAndUpdate(assignment.orderId, { status: 'delivered' });
    } else if (status === 'failed') {
      assignment.failedAt = new Date();
      assignment.failureReason = failureReason || 'Delivery attempt failed';
    }

    await assignment.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: `DELIVERY_${status.toUpperCase()}`,
      entityType: 'DeliveryAssignment',
      entityId: assignment._id.toString(),
      details: { status, failureReason },
    });

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

