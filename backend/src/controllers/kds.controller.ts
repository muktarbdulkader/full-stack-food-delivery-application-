import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order.model';
import { createError } from '../middlewares/error.middleware';
import {
  emitOrderStatusUpdate,
  emitOrderToKitchen,
  getIO,
} from '../services/socket.service';

// ─── GET Active Kitchen Orders ───────────────────────────────────────────────
// GET /api/kds/orders?branchId=&station=
export const getKitchenOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, station } = req.query;

    const filter: Record<string, any> = {
      status: { $in: ['pending', 'confirmed', 'preparing'] },
    };
    if (branchId) filter.branchId = branchId;
    if (station) filter['items.station'] = station;

    const orders = await Order.find(filter)
      .populate('items.food', 'name image category')
      .populate('tableId', 'tableNumber area')
      .sort({ createdAt: 1 }) // oldest first
      .lean();

    res.status(200).json({ status: 'success', data: { orders } });
  } catch (error) {
    next(error);
  }
};

// ─── GET Single Kitchen Order ─────────────────────────────────────────────────
// GET /api/kds/orders/:id
export const getKitchenOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.food', 'name image category')
      .populate('tableId', 'tableNumber area');

    if (!order) throw createError('Order not found', 404);

    res.status(200).json({ status: 'success', data: { order } });
  } catch (error) {
    next(error);
  }
};

// ─── START Preparation ────────────────────────────────────────────────────────
// PATCH /api/kds/orders/:id/start
export const startPreparation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw createError('Order not found', 404);

    if (order.status !== 'confirmed' && order.status !== 'pending') {
      throw createError(`Cannot start preparation for order in status: ${order.status}`, 400);
    }

    order.status = 'preparing';
    order.preparationStartedAt = new Date();
    order.statusHistory = order.statusHistory ?? [];
    order.statusHistory.push({ status: 'preparing', timestamp: new Date() });
    await order.save();

    // Notify customer via table socket
    if (order.tableId) {
      emitOrderStatusUpdate(
        order.tableId.toString(),
        order._id.toString(),
        'preparing'
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Preparation started',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MARK Item Ready ──────────────────────────────────────────────────────────
// PATCH /api/kds/orders/:id/items/:itemIndex/ready
export const markItemReady = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, itemIndex } = req.params;
    const order = await Order.findById(id);
    if (!order) throw createError('Order not found', 404);

    const idx = parseInt(itemIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= order.items.length) {
      throw createError('Invalid item index', 400);
    }

    order.items[idx].isKitchenReady = true;
    const allReady = order.items.every((item) => item.isKitchenReady);

    if (allReady) {
      order.status = 'ready';
      order.readyAt = new Date();
      order.statusHistory = order.statusHistory ?? [];
      order.statusHistory.push({ status: 'ready', timestamp: new Date() });

      // Notify waiter room
      const io = getIO();
      if (io && order.branchId) {
        io.to(`waiters_${order.branchId.toString()}`).emit('order_ready', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          branchId: order.branchId,
        });
      }
      // Notify customer
      if (order.tableId) {
        emitOrderStatusUpdate(
          order.tableId.toString(),
          order._id.toString(),
          'ready'
        );
      }
    }

    await order.save();

    res.status(200).json({
      status: 'success',
      message: allReady ? 'All items ready — order marked READY' : 'Item marked ready',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MARK Entire Order Ready ──────────────────────────────────────────────────
// PATCH /api/kds/orders/:id/ready
export const markOrderReady = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw createError('Order not found', 404);

    if (!['confirmed', 'preparing'].includes(order.status)) {
      throw createError(`Order is already ${order.status}`, 400);
    }

    order.items.forEach((item) => (item.isKitchenReady = true));
    order.status = 'ready';
    order.readyAt = new Date();
    order.statusHistory = order.statusHistory ?? [];
    order.statusHistory.push({ status: 'ready', timestamp: new Date() });
    await order.save();

    const io = getIO();
    if (io && order.branchId) {
      io.to(`waiters_${order.branchId.toString()}`).emit('order_ready', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        branchId: order.branchId,
      });
    }
    if (order.tableId) {
      emitOrderStatusUpdate(
        order.tableId.toString(),
        order._id.toString(),
        'ready'
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Order marked as READY',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── MARK Served ──────────────────────────────────────────────────────────────
// PATCH /api/kds/orders/:id/served
export const markOrderServed = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw createError('Order not found', 404);

    order.status = 'served';
    order.servedAt = new Date();
    order.statusHistory = order.statusHistory ?? [];
    order.statusHistory.push({ status: 'served', timestamp: new Date() });
    await order.save();

    if (order.tableId) {
      emitOrderStatusUpdate(
        order.tableId.toString(),
        order._id.toString(),
        'served'
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Order marked as SERVED',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── CANCEL from Kitchen ──────────────────────────────────────────────────────
// PATCH /api/kds/orders/:id/cancel
export const cancelKitchenOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw createError('Order not found', 404);

    if (['served', 'delivered', 'cancelled'].includes(order.status)) {
      throw createError(`Cannot cancel order with status: ${order.status}`, 400);
    }

    order.status = 'cancelled';
    order.statusHistory = order.statusHistory ?? [];
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason || 'Cancelled from KDS',
    });
    await order.save();

    if (order.tableId) {
      emitOrderStatusUpdate(
        order.tableId.toString(),
        order._id.toString(),
        'cancelled'
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET Kitchen Stats ────────────────────────────────────────────────────────
// GET /api/kds/stats?branchId=
export const getKitchenStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.query;
    const filter: Record<string, any> = {};
    if (branchId) filter.branchId = branchId;

    const [pending, confirmed, preparing, ready, served] = await Promise.all([
      Order.countDocuments({ ...filter, status: 'pending' }),
      Order.countDocuments({ ...filter, status: 'confirmed' }),
      Order.countDocuments({ ...filter, status: 'preparing' }),
      Order.countDocuments({ ...filter, status: 'ready' }),
      Order.countDocuments({ ...filter, status: 'served' }),
    ]);

    res.status(200).json({
      status: 'success',
      data: { stats: { pending, confirmed, preparing, ready, served } },
    });
  } catch (error) {
    next(error);
  }
};
