import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order.model';
import { User } from '../models/User.model';
import { Food } from '../models/Food.model';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      totalUsers,
      totalFoods,
      pendingOrders,
      todayOrders,
      revenueResult,
      todayRevenueResult,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Food.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalOrders,
        totalRevenue,
        totalUsers,
        totalFoods,
        pendingOrders,
        todayOrders,
        todayRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        dailyRevenue,
        ordersByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};


// Confirm payment manually
export const confirmPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { transactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ status: 'error', message: 'Order not found' });
      return;
    }

    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
    order.payment.transactionId = transactionId || `MANUAL-${Date.now()}`;
    order.payment.confirmedBy = req.user?._id;

    // Add to status history
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'payment_confirmed',
      timestamp: new Date(),
      note: `Payment confirmed manually${transactionId ? ` - TxID: ${transactionId}` : ''}`,
    });

    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment confirmed successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// Assign delivery driver
export const assignDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { driverName, driverPhone, estimatedMinutes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ status: 'error', message: 'Order not found' });
      return;
    }

    const estimatedArrival = new Date();
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + (estimatedMinutes || 30));

    order.tracking = {
      assignedDriver: driverName,
      driverPhone: driverPhone,
      estimatedArrival: estimatedArrival,
    };

    order.status = 'out_for_delivery';
    order.estimatedDelivery = estimatedArrival;

    // Add to status history
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'out_for_delivery',
      timestamp: new Date(),
      note: `Assigned to ${driverName} (${driverPhone})`,
    });

    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Driver assigned successfully',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// Get order with full details for delivery
export const getOrderDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('items.food')
      .populate('user', 'name email phone');

    if (!order) {
      res.status(404).json({ status: 'error', message: 'Order not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
