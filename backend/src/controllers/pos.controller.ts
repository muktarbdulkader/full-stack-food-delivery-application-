import { Request, Response, NextFunction } from 'express';
import { Order, IOrder } from '../models/Order.model';
import { Food } from '../models/Food.model';
import { RestaurantTable } from '../models/RestaurantTable.model';
import { Branch } from '../models/Branch.model';
import { Organization } from '../models/Organization.model';
import { TableSession } from '../models/TableSession.model';
import { createError } from '../middlewares/error.middleware';
import { emitOrderToKitchen } from '../services/socket.service';
import { generateSecureQRToken, generateTableQRCodeDataUrl } from '../services/qr.service';

// ─── Helper: generate order number ───────────────────────────────────────────
const generateOrderNumber = (): string => {
  const prefix = 'POS';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
};

// ─── CREATE POS Sale / Dine-in Table Order ─────────────────────────────────────
// POST /api/pos/sale
export const createPosSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      items,                // [{ foodId, quantity, selectedPortion, selectedExtras, instructions }]
      orderType = 'dine_in',// 'dine_in' | 'takeaway' | 'delivery'
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

    // ── Fault-Tolerant Table Resolution (Hotel & Restaurant Standard) ──────
    let resolvedTableId: string | undefined;
    let resolvedTableNumber: string | undefined;
    let resolvedBranchId: string | undefined = branchId;
    let resolvedOrgId: string | undefined = organizationId;
    let resolvedSessionId: string | undefined;

    if (orderType === 'dine_in') {
      const activeBranchId = branchId || (req as any).user?.branchId;
      let table: any = null;

      // 1. Direct ID lookup
      if (tableId) {
        table = await RestaurantTable.findById(tableId);
      }

      // 2. Flexible number lookup
      if (!table && tableNumber) {
        const raw = String(tableNumber).trim();
        const unpadded = raw.replace(/^0+/, '') || raw;
        const padded = raw.padStart(2, '0');
        const stripped = raw.replace(/^(table|t-?)\s*/i, '').trim();
        const strippedPadded = stripped ? stripped.padStart(2, '0') : raw;
        const candidates = Array.from(
          new Set([raw, unpadded, padded, stripped, strippedPadded])
        ).filter(Boolean);

        // Try with branch filter
        if (activeBranchId) {
          table = await RestaurantTable.findOne({
            branchId: activeBranchId,
            tableNumber: { $in: candidates },
          });
        }

        // Try global table registry
        if (!table) {
          table = await RestaurantTable.findOne({
            tableNumber: { $in: candidates },
          });
        }

        // Try case-insensitive matching
        if (!table) {
          table = await RestaurantTable.findOne({
            tableNumber: { $regex: new RegExp(`^${raw}$`, 'i') },
          });
        }
      }

      // 3. Fallback Auto-Registration if not in database
      if (!table && tableNumber) {
        const defaultBranch = activeBranchId
          ? await Branch.findById(activeBranchId)
          : await Branch.findOne();
        const defaultOrg = organizationId
          ? await Organization.findById(organizationId)
          : defaultBranch?.organizationId
          ? await Organization.findById(defaultBranch.organizationId)
          : await Organization.findOne();

        if (defaultBranch && defaultOrg) {
          const rawNum = String(tableNumber).trim();
          const qrToken = generateSecureQRToken();
          const qrCodeUrl = await generateTableQRCodeDataUrl(qrToken);

          table = await RestaurantTable.create({
            organizationId: defaultOrg._id,
            branchId: defaultBranch._id,
            tableNumber: rawNum,
            name: `Table ${rawNum}`,
            diningArea: 'Main Dining',
            capacity: 4,
            status: 'occupied',
            qrToken,
            qrCodeUrl,
            isActive: true,
          });
        }
      }

      // 4. Update status and session
      if (table) {
        resolvedTableId = table._id.toString();
        resolvedTableNumber = table.tableNumber;
        resolvedBranchId = table.branchId?.toString() || resolvedBranchId;
        resolvedOrgId = table.organizationId?.toString() || resolvedOrgId;

        // Auto mark table as occupied
        if (table.status !== 'occupied') {
          table.status = 'occupied';
          await table.save();
        }

        // Ensure active TableSession for adding multiple foods / rounds
        let session = await TableSession.findOne({
          tableId: table._id,
          status: 'active',
        });

        if (!session) {
          session = await TableSession.create({
            organizationId: table.organizationId,
            branchId: table.branchId,
            tableId: table._id,
            tableNumber: table.tableNumber,
            guestCount: 2,
            status: 'active',
            openedAt: new Date(),
            openedBy: (req as any).user?._id,
            orders: [],
            subtotal: 0,
            tax: 0,
            serviceCharge: 0,
            discount: 0,
            totalAmount: 0,
            paidAmount: 0,
            balanceDue: 0,
            paymentStatus: 'unpaid',
          });

          table.currentSessionId = session._id;
          await table.save();
        }

        resolvedSessionId = session._id.toString();
      } else {
        // Fallback: still accept order so guest receives food
        resolvedTableNumber = String(tableNumber || '01').trim();
      }
    }

    // Fallback branch and org if takeaway or unassigned
    if (!resolvedBranchId) {
      const fbBranch = await Branch.findOne();
      resolvedBranchId = fbBranch?._id?.toString();
      resolvedOrgId = fbBranch?.organizationId?.toString() || resolvedOrgId;
    }

    // ── Create Order ───────────────────────────────────────────────────────
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      orderType: orderType || 'dine_in',
      organizationId: resolvedOrgId,
      branchId: resolvedBranchId,
      user: customerId,
      tableId: resolvedTableId,
      tableNumber: resolvedTableNumber,
      tableSessionId: resolvedSessionId,
      items: resolvedItems,
      subtotal,
      tax,
      discount: discountAmount,
      totalAmount,
      status: 'confirmed', // POS / Waiter orders go straight to confirmed
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cash' ? 'paid' : 'pending',
        paidAt: paymentMethod === 'cash' ? new Date() : undefined,
        confirmedBy: (req as any).user?._id,
      },
      phone: customerPhone || '',
      notes: notes || `Order for Table ${resolvedTableNumber || 'Walk-in'}`,
      deliveryAddress: deliveryAddress || '',
      statusHistory: [{ status: 'confirmed', timestamp: new Date() }],
    });

    // ── Append Order to Active Table Session ───────────────────────────────
    if (resolvedSessionId) {
      const session = await TableSession.findById(resolvedSessionId);
      if (session) {
        session.orders.push(order._id);
        session.subtotal = parseFloat((session.subtotal + subtotal).toFixed(2));
        session.tax = parseFloat((session.tax + tax).toFixed(2));
        session.discount = parseFloat((session.discount + discountAmount).toFixed(2));
        session.totalAmount = parseFloat((session.totalAmount + totalAmount).toFixed(2));
        session.balanceDue = parseFloat(
          (paymentMethod === 'cash' ? session.balanceDue : session.balanceDue + totalAmount).toFixed(2)
        );
        if (paymentMethod === 'cash') {
          session.paidAmount = parseFloat((session.paidAmount + totalAmount).toFixed(2));
          if (session.balanceDue <= 0) {
            session.paymentStatus = 'paid';
          }
        }
        await session.save();
      }
    }

    // ── Broadcast to Kitchen Display System (KDS) ──────────────────────────
    if (resolvedBranchId) {
      emitOrderToKitchen(resolvedBranchId, {
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
      .populate('items.food', 'name image price category')
      .lean();

    res.status(201).json({
      status: 'success',
      message: `Order for Table ${resolvedTableNumber || 'POS'} placed successfully`,
      data: {
        order: populated,
        orderNumber: order.orderNumber,
        tableNumber: resolvedTableNumber,
      },
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
