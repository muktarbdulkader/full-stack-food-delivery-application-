import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { RestaurantTable } from '../models/RestaurantTable.model';
import { TableSession } from '../models/TableSession.model';
import { GuestSession } from '../models/GuestSession.model';
import { Branch } from '../models/Branch.model';
import { Organization } from '../models/Organization.model';
import { Food } from '../models/Food.model';
import { Order } from '../models/Order.model';
import { WaiterRequest } from '../models/WaiterRequest.model';
import { createError } from '../middlewares/error.middleware';
import {
  emitOrderToKitchen,
  emitWaiterCall,
  emitTableStatusUpdate,
} from '../services/socket.service';

export const resolveQRScan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrToken } = req.params;
    const { guestToken: existingGuestToken } = req.query;

    const table = await RestaurantTable.findOne({ qrToken, isActive: true })
      .populate('branchId')
      .populate('organizationId');

    if (!table) {
      throw createError('Invalid or inactive table QR code. Please ask a waiter for assistance.', 404);
    }

    const branch = table.branchId as any;
    const organization = table.organizationId as any;

    if (!branch?.isActive) {
      throw createError('This restaurant branch is currently closed.', 400);
    }

    // Resolve or initialize TableSession
    let session = await TableSession.findOne({
      tableId: table._id,
      status: { $in: ['active', 'billing'] },
    }).populate({
      path: 'orders',
      populate: { path: 'items.food', select: 'name price image portions extras' },
    });

    if (!session) {
      session = await TableSession.create({
        organizationId: organization._id,
        branchId: branch._id,
        tableId: table._id,
        tableNumber: table.tableNumber,
        status: 'active',
        guestCount: 1,
      });

      // Update table current session and status
      table.currentSessionId = session._id;
      if (table.status === 'available') {
        table.status = 'occupied';
        await table.save();
        emitTableStatusUpdate(branch._id.toString(), table._id.toString(), 'occupied');
      }
    }

    // Resolve or initialize GuestSession
    let guestSession: any = null;
    let guestToken = existingGuestToken as string;

    if (guestToken) {
      guestSession = await GuestSession.findOne({
        guestToken,
        tableSessionId: session._id,
      });
    }

    if (!guestSession) {
      guestToken = crypto.randomBytes(16).toString('hex');
      guestSession = await GuestSession.create({
        guestToken,
        tableSessionId: session._id,
        tableId: table._id,
        branchId: branch._id,
        organizationId: organization._id,
        guestName: `Guest #${Math.floor(100 + Math.random() * 900)}`,
      });
    }

    // Load available menu for this branch
    const menuFilter: Record<string, any> = { isAvailable: true };
    const foods = await Food.find(menuFilter).sort({ category: 1, name: 1 });

    // Distinct categories
    const categories = Array.from(new Set(foods.map((f) => f.category)));

    res.status(200).json({
      status: 'success',
      data: {
        restaurant: {
          name: organization.name,
          logo: organization.logo,
          currency: organization.settings?.currency || 'ETB',
          taxRate: organization.settings?.taxRate ?? 0.15,
          serviceChargeRate: organization.settings?.serviceChargeRate ?? 0.05,
        },
        branch: {
          id: branch._id,
          name: branch.name,
          code: branch.code,
          phone: branch.phone,
          city: branch.address?.city,
        },
        table: {
          id: table._id,
          number: table.tableNumber,
          name: table.name,
          diningArea: table.diningArea,
          status: table.status,
        },
        session: {
          id: session._id,
          status: session.status,
          totalAmount: session.totalAmount,
          balanceDue: session.balanceDue,
          ordersCount: session.orders?.length || 0,
        },
        guest: {
          token: guestToken,
          name: guestSession.guestName,
          cart: guestSession.cart || [],
        },
        menu: {
          categories,
          foods,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const placeDineInOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrToken, guestToken, items, specialInstructions } = req.body;

    if (!qrToken || !items || !Array.isArray(items) || items.length === 0) {
      throw createError('Invalid order parameters: QR token and items are required', 400);
    }

    const table = await RestaurantTable.findOne({ qrToken, isActive: true })
      .populate('branchId')
      .populate('organizationId');

    if (!table) throw createError('Table session expired or invalid QR code', 404);

    const branch = table.branchId as any;
    const organization = table.organizationId as any;

    let session = await TableSession.findOne({
      tableId: table._id,
      status: { $in: ['active', 'billing'] },
    });

    if (!session) {
      session = await TableSession.create({
        organizationId: organization._id,
        branchId: branch._id,
        tableId: table._id,
        tableNumber: table.tableNumber,
        status: 'active',
      });
      table.currentSessionId = session._id;
      table.status = 'occupied';
      await table.save();
    }

    // Resolve GuestSession
    let guestSession = await GuestSession.findOne({ guestToken, tableSessionId: session._id });
    if (!guestSession) {
      const newGuestToken = crypto.randomBytes(16).toString('hex');
      guestSession = await GuestSession.create({
        guestToken: newGuestToken,
        tableSessionId: session._id,
        tableId: table._id,
        branchId: branch._id,
        organizationId: organization._id,
      });
    }

    // Re-verify and calculate prices strictly on backend
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const food = await Food.findById(item.foodId);
      if (!food) throw createError(`Food item with ID ${item.foodId} not found`, 404);
      if (!food.isAvailable) throw createError(`${food.name} is currently sold out`, 400);

      // Check portion sizing
      let unitPrice = food.price;
      if (item.selectedPortion && food.portions && food.portions.length > 0) {
        const foundPortion = food.portions.find((p) => p.name === item.selectedPortion);
        if (foundPortion) unitPrice = foundPortion.price;
      }

      // Check extras
      let extrasCost = 0;
      const validExtras: any[] = [];
      if (item.selectedExtras && Array.isArray(item.selectedExtras) && food.extras) {
        for (const ext of item.selectedExtras) {
          const matchedExtra = food.extras.find((e) => e.name === ext.name);
          if (matchedExtra) {
            extrasCost += matchedExtra.price;
            validExtras.push({ name: matchedExtra.name, price: matchedExtra.price });
          }
        }
      }

      const itemTotal = (unitPrice + extrasCost) * Number(item.quantity);
      subtotal += itemTotal;

      orderItems.push({
        food: food._id,
        quantity: item.quantity,
        price: unitPrice + extrasCost,
        selectedPortion: item.selectedPortion,
        selectedExtras: validExtras,
        instructions: item.instructions || '',
        station: food.kitchenStation || 'Main Kitchen',
      });
    }

    const taxRate = organization.settings?.taxRate ?? 0.15;
    const serviceRate = organization.settings?.serviceChargeRate ?? 0.05;
    const tax = Math.round(subtotal * taxRate);
    const serviceCharge = Math.round(subtotal * serviceRate);
    const totalAmount = subtotal + tax + serviceCharge;

    const orderNumber = `DIN-${table.tableNumber}-${Date.now().toString().slice(-4)}`;

    const order = await Order.create({
      orderNumber,
      orderType: 'dine_in',
      organizationId: organization._id,
      branchId: branch._id,
      tableId: table._id,
      tableNumber: table.tableNumber,
      tableSessionId: session._id,
      guestSessionId: guestSession._id,
      items: orderItems,
      subtotal,
      tax,
      serviceCharge,
      totalAmount,
      status: 'confirmed',
      notes: specialInstructions || '',
      payment: {
        method: 'cash',
        status: 'pending',
      },
    });

    // Update TableSession running tab
    session.orders.push(order._id);
    session.subtotal += subtotal;
    session.tax += tax;
    session.serviceCharge += serviceCharge;
    session.totalAmount += totalAmount;
    session.balanceDue += totalAmount;
    await session.save();

    // Update guest session cart & placed orders
    guestSession.placedOrders.push(order._id);
    guestSession.cart = [];
    await guestSession.save();

    // Update Table status to waiting_for_food
    table.status = 'waiting_for_food';
    await table.save();

    // Real-time broadcast
    emitOrderToKitchen(branch._id.toString(), {
      orderId: order._id,
      orderNumber,
      tableNumber: table.tableNumber,
      diningArea: table.diningArea,
      items: orderItems,
      totalAmount,
      createdAt: order.createdAt,
    });
    emitTableStatusUpdate(branch._id.toString(), table._id.toString(), 'waiting_for_food');

    const populatedOrder = await Order.findById(order._id).populate('items.food', 'name image price');

    res.status(201).json({
      status: 'success',
      message: `Order #${orderNumber} placed for Table ${table.tableNumber}`,
      data: {
        order: populatedOrder,
        sessionTotal: session.totalAmount,
        balanceDue: session.balanceDue,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const callWaiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrToken, requestType, note } = req.body;

    const table = await RestaurantTable.findOne({ qrToken, isActive: true });
    if (!table) throw createError('Table not found or invalid QR token', 404);

    // Prevent spam: check if identical pending request exists in last 60 seconds
    const recentRequest = await WaiterRequest.findOne({
      tableId: table._id,
      requestType: requestType || 'waiter',
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 60000) },
    });

    if (recentRequest) {
      res.status(200).json({
        status: 'success',
        message: 'A waiter request was already submitted. Staff is on the way!',
        data: { request: recentRequest },
      });
      return;
    }

    const waiterRequest = await WaiterRequest.create({
      organizationId: table.organizationId,
      branchId: table.branchId,
      tableId: table._id,
      tableNumber: table.tableNumber,
      tableSessionId: table.currentSessionId,
      requestType: requestType || 'waiter',
      status: 'pending',
      note: note || '',
    });

    emitWaiterCall(table.branchId.toString(), {
      id: waiterRequest._id,
      tableNumber: table.tableNumber,
      diningArea: table.diningArea,
      requestType: waiterRequest.requestType,
      createdAt: waiterRequest.createdAt,
    });

    res.status(201).json({
      status: 'success',
      message: `Staff alerted for Table ${table.tableNumber}! A team member is heading over.`,
      data: { request: waiterRequest },
    });
  } catch (error) {
    next(error);
  }
};

export const getTableBill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrToken } = req.params;

    const table = await RestaurantTable.findOne({ qrToken, isActive: true })
      .populate('branchId', 'name code')
      .populate('organizationId', 'name settings');

    if (!table) throw createError('Table not found', 404);

    const session = await TableSession.findOne({
      tableId: table._id,
      status: { $in: ['active', 'billing', 'settled'] },
    }).populate({
      path: 'orders',
      populate: { path: 'items.food', select: 'name price image' },
    });

    if (!session) {
      res.status(200).json({
        status: 'success',
        data: {
          tableNumber: table.tableNumber,
          hasActiveOrders: false,
          orders: [],
          totalAmount: 0,
          balanceDue: 0,
        },
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        tableNumber: table.tableNumber,
        diningArea: table.diningArea,
        sessionStatus: session.status,
        orders: session.orders,
        subtotal: session.subtotal,
        tax: session.tax,
        serviceCharge: session.serviceCharge,
        discount: session.discount,
        totalAmount: session.totalAmount,
        paidAmount: session.paidAmount,
        balanceDue: session.balanceDue,
        paymentStatus: session.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const requestBill = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrToken, paymentMethod } = req.body;

    const table = await RestaurantTable.findOne({ qrToken, isActive: true });
    if (!table) throw createError('Table not found', 404);

    const session = await TableSession.findOne({
      tableId: table._id,
      status: 'active',
    });

    if (!session) throw createError('No active dining session found to bill', 400);

    session.status = 'billing';
    await session.save();

    table.status = 'waiting_for_payment';
    await table.save();

    const waiterRequest = await WaiterRequest.create({
      organizationId: table.organizationId,
      branchId: table.branchId,
      tableId: table._id,
      tableNumber: table.tableNumber,
      tableSessionId: session._id,
      requestType: 'bill',
      status: 'pending',
      note: `Requested bill via ${paymentMethod || 'Cash / Telebirr'}. Total Due: ${session.balanceDue} ETB`,
    });

    emitWaiterCall(table.branchId.toString(), {
      id: waiterRequest._id,
      tableNumber: table.tableNumber,
      requestType: 'bill',
      totalDue: session.balanceDue,
      createdAt: waiterRequest.createdAt,
    });
    emitTableStatusUpdate(table.branchId.toString(), table._id.toString(), 'waiting_for_payment');

    res.status(200).json({
      status: 'success',
      message: 'Bill requested! Staff has been notified with your invoice.',
      data: {
        tableNumber: table.tableNumber,
        totalDue: session.balanceDue,
      },
    });
  } catch (error) {
    next(error);
  }
};

