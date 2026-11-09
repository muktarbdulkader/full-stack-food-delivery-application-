import { Response, NextFunction } from 'express';
import { Order } from '../models/Order.model';
import { Food } from '../models/Food.model';
import { User } from '../models/User.model';
import { createError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../utils/email';

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items, location, payment, phone, notes } = req.body;
    const userId = req.user!._id;

    if (!items || items.length === 0) {
      throw createError('Order must have at least one item', 400);
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const food = await Food.findById(item.foodId);
      if (!food) throw createError(`Food with id ${item.foodId} not found`, 404);
      if (!food.isAvailable) throw createError(`${food.name} is not available`, 400);

      totalAmount += food.price * item.quantity;
      orderItems.push({ food: food._id, quantity: item.quantity, price: food.price });
    }

    const deliveryAddress = location ? `${location.address}, ${location.city}, ${location.zipCode || ''}` : '';
    const estimatedDelivery = new Date(Date.now() + 45 * 60 * 1000);

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      location,
      payment: {
        method: payment?.method || 'cash',
        status: 'pending',
      },
      phone,
      notes,
      estimatedDelivery,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('items.food', 'name price image')
      .populate('user', 'name email');

    // Send confirmation email
    const user = await User.findById(userId);
    if (user?.email) {
      sendOrderConfirmation(user.email, order._id.toString(), totalAmount);
    }

    res.status(201).json({ status: 'success', data: { order: populatedOrder } });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await Order.find({ user: req.user!._id })
      .populate('items.food', 'name price image')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.food', 'name price image')
      .populate('user', 'name email');

    if (!order) throw createError('Order not found', 404);

    if (req.user!.role !== 'admin' && (!order.user || order.user?._id?.toString() !== req.user!._id.toString())) {
      throw createError('Not authorized', 403);
    }

    res.status(200).json({ status: 'success', data: { order } });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, branchId } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    if (req.user?.role !== 'super_admin' && req.user?.organizationId) {
      filter.organizationId = req.user.organizationId;
    }
    if (branchId) filter.branchId = branchId;

    const orders = await Order.find(filter)
      .populate('items.food', 'name price image')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) throw createError('Invalid status', 400);

    const order = await Order.findById(req.params.id).populate('user', 'email');
    if (!order) throw createError('Order not found', 404);

    const previousStatus = order.status;
    order.status = status;

    // Add to status history
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: `Status changed from ${previousStatus} to ${status}`,
    });

    // Auto-set payment as paid when delivered
    if (status === 'delivered') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      if (order.tracking) {
        order.tracking.deliveredAt = new Date();
      }
    }

    // Set estimated delivery when confirmed
    if (status === 'confirmed' && !order.estimatedDelivery) {
      order.estimatedDelivery = new Date(Date.now() + 45 * 60 * 1000); // 45 minutes
    }

    // Set estimated delivery when preparing
    if (status === 'preparing' && !order.estimatedDelivery) {
      order.estimatedDelivery = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await order.save();

    // Send email notification
    const userEmail = (order.user as unknown as { email: string })?.email;
    if (userEmail) {
      sendOrderStatusUpdate(userEmail, order._id.toString(), status);
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('items.food', 'name price image')
      .populate('user', 'name email');

    res.status(200).json({ status: 'success', data: { order: updatedOrder } });
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId, paymentMethod, transactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) throw createError('Order not found', 404);

    order.payment = {
      method: paymentMethod,
      status: 'paid',
      transactionId,
      paidAt: new Date(),
    };
    await order.save();

    res.status(200).json({ status: 'success', message: 'Payment processed', data: { order } });
  } catch (error) {
    next(error);
  }
};
