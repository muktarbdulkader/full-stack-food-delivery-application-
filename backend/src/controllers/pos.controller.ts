import { Request, Response, NextFunction } from 'express';
import { Order, IOrder } from '../models/Order.model';
import { Food } from '../models/Food.model';
import { RestaurantTable } from '../models/RestaurantTable.model';
import { createError } from '../middlewares/error.middleware';
import { emitOrderToKitchen } from '../services/socket.service';

// ─── Helper: generate order number ───────────────────────────────────────────
const generateOrderNumber = (): string => {
  const prefix = 'POS';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
};

// ─── CREATE POS Sale ──────────────────────────────────────────────────────────
// POST /api/pos/sale
export const createPosSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      items,                // [{ foodId, quantity, selectedPortion, selectedExtras, instructions }]
      orderType,            // 'dine_in' | 'takeaway' | 'delivery'
      tableNumber,          // for dine_in
      tableId,              // for dine_in
      customerId,           // optional registered customer
      customerName,         // optional walk-in name
      customerPhone,
      discount = 0,
      paymentMethod = 'cash',
      branchId,
      organizationId,
      deliveryAddress,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError('At least one item is required', 400);
    }

    // ── Resolve foods and calculate totals server-side ──────────────────────
    let subtotal = 0;
    const resolvedItems: IOrder['items'] = [];

    for (const item of items) {
      const food = await Food.findById(item.foodId).lean();
      if (!food) throw createError(`Food not found: ${item.foodId}`, 404);
      if (!food.isAvailable) throw createError(`${food.name} is not available`, 400);

      // Resolve portion price
      let unitPrice = food.price;
      if (item.selectedPortion && food.portions) {
        const portion = food.portions.find(
          (p: any) => p.name === item.selectedPortion
        );
        if (portion) unitPrice = portion.price;
      }

      // Add extras
      let extrasTotal = 0;
      const resolvedExtras: { name: string; price: number }[] = [];
      if (item.selectedExtras && Array.isArray(item.selectedExtras)) {
        for (const extra of item.selectedExtras) {
          if (food.extras) {
            const dbExtra = food.extras.find((e: any) => e.name === extra.name);
            if (dbExtra) {
              resolvedExtras.push({ name: dbExtra.name, price: dbExtra.price });
              extrasTotal += dbExtra.price;
            }
          }
        }
      }

      const lineTotal = (unitPrice + extrasTotal) * item.quantity;
      subtotal += lineTotal;

      resolvedItems.push({
        food: food._id as any,
        quantity: item.quantity,
        price: unitPrice + extrasTotal,
        selectedPortion: item.selectedPortion,
        selectedExtras: resolvedExtras,
        instructions: item.instructions || '',
        station: food.kitchenStation || 'Main Kitchen',
        isKitchenReady: false,
      });
    }

    // ── Tax & totals ───────────────────────────────────────────────────────
    const TAX_RATE = 0.15; // 15% VAT
    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const discountAmount = Math.min(discount, subtotal);
    const totalAmount = parseFloat((subtotal + tax - discountAmount).toFixed(2));

    // ── Validate table for dine-in ─────────────────────────────────────────
    let resolvedTableId: string | undefined;
    let resolvedTableNumber: string | undefined;

    if (orderType === 'dine_in') {
      if (!tableId && !tableNumber) {
        throw createError('Table ID or table number is required for dine-in orders', 400);
      }
      const table = tableId
        ? await RestaurantTable.findById(tableId)
        : await RestaurantTable.findOne({ tableNumber, branchId });

      if (!table) throw createError('Table not found', 404);
      if (!table.isActive) throw createError('Table is not active', 400);

      resolvedTableId = table._id.toString();
      resolvedTableNumber = table.tableNumber;
    }

    // ── Create Order ───────────────────────────────────────────────────────
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      orderType: orderType || 'takeaway',
      organizationId,
      branchId,
      user: customerId,
      tableId: resolvedTableId,
      tableNumber: resolvedTableNumber,
      items: resolvedItems,
      subtotal,
      tax,
      discount: discountAmount,
      totalAmount,
      status: 'confirmed', // POS orders go straight to confirmed
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cash' ? 'paid' : 'pending',
        paidAt: paymentMethod === 'cash' ? new Date() : undefined,
        confirmedBy: (req as any).user?._id,
      },
      phone: customerPhone || '',
      notes: notes || `POS Sale — ${customerName || 'Walk-in'}`,
      deliveryAddress: deliveryAddress || '',
      statusHistory: [{ status: 'confirmed', timestamp: new Date() }],
    });

    // ── Broadcast to kitchen ───────────────────────────────────────────────
    if (branchId) {
      emitOrderToKitchen(branchId, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        tableNumber: resolvedTableNumber,
        items: resolvedItems,
        notes: order.notes,
        createdAt: order.createdAt,
      });
    }

    const populated = await Order.findById(order._id)
      .populate('items.food', 'name image')
      .lean();

    res.status(201).json({
      status: 'success',
      message: 'Sale created successfully',
      data: { order: populated },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET POS Sales History ────────────────────────────────────────────────────
// GET /api/pos/sales?branchId=&date=&orderType=&page=&limit=
export const getPosSales = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, orderType, date, page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = {};

    if (branchId) filter.branchId = branchId;
    if (orderType) filter.orderType = orderType;
    if (date) {
      const start = new Date(date as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date as string);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.food', 'name image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET POS Dashboard Stats ──────────────────────────────────────────────────
// GET /api/pos/stats?branchId=&date=
export const getPosStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, date } = req.query;
    const filter: Record<string, any> = {
      status: { $nin: ['cancelled'] },
    };
    if (branchId) filter.branchId = branchId;

    if (date) {
      const start = new Date(date as string);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date as string);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const [totalOrders, revenue, byType] = await Promise.all([
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$orderType',
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalOrders,
          totalRevenue: revenue[0]?.total ?? 0,
          byType,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PROCESS Refund ───────────────────────────────────────────────────────────
// PATCH /api/pos/sales/:id/refund
export const processRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw createError('Order not found', 404);

    if (order.payment.status === 'refunded') {
      throw createError('Order already refunded', 400);
    }

    order.payment.status = 'refunded';
    order.status = 'cancelled';
    order.statusHistory = order.statusHistory ?? [];
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: `Refunded: ${reason || 'No reason provided'}`,
    });
    await order.save();

    res.status(200).json({
      status: 'success',
      message: 'Refund processed',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET Available Tables for POS ────────────────────────────────────────────
// GET /api/pos/tables?branchId=
export const getPOSTables = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId } = req.query;
    const filter: Record<string, any> = { isActive: true };
    if (branchId) filter.branchId = branchId;

    const tables = await RestaurantTable.find(filter)
      .select('tableNumber area capacity status')
      .sort({ tableNumber: 1 })
      .lean();

    res.status(200).json({ status: 'success', data: { tables } });
  } catch (error) {
    next(error);
  }
};
