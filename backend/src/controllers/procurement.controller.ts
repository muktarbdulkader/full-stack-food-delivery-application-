import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Supplier } from '../models/Supplier.model';
import { PurchaseOrder } from '../models/PurchaseOrder.model';
import { Ingredient } from '../models/Ingredient.model';
import { StockMovement } from '../models/StockMovement.model';
import { createError } from '../middlewares/error.middleware';

const generatePONumber = (): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PO-${ts}-${rand}`;
};

// ══════════════════════════════════════════════════════════
// SUPPLIERS
// ══════════════════════════════════════════════════════════

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, category, search } = req.query;
    const filter: Record<string, any> = { isActive: true };
    if (branchId) filter.branchId = branchId;
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const suppliers = await Supplier.find(filter).sort({ name: 1 }).lean();
    res.status(200).json({ status: 'success', data: { suppliers } });
  } catch (error) { next(error); }
};

export const getSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) throw createError('Supplier not found', 404);
    res.status(200).json({ status: 'success', data: { supplier } });
  } catch (error) { next(error); }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ status: 'success', data: { supplier } });
  } catch (error) { next(error); }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) throw createError('Supplier not found', 404);
    res.status(200).json({ status: 'success', data: { supplier } });
  } catch (error) { next(error); }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!supplier) throw createError('Supplier not found', 404);
    res.status(200).json({ status: 'success', message: 'Supplier deactivated' });
  } catch (error) { next(error); }
};

// ══════════════════════════════════════════════════════════
// PURCHASE ORDERS
// ══════════════════════════════════════════════════════════

export const getPurchaseOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, status, supplierId, page = '1', limit = '20' } = req.query;
    const filter: Record<string, any> = {};
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;
    if (supplierId) filter.supplier = supplierId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate('supplier', 'name phone')
        .populate('items.ingredient', 'name unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      PurchaseOrder.countDocuments(filter),
    ]);

    res.status(200).json({ status: 'success', data: { orders, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) } } });
  } catch (error) { next(error); }
};

export const getPurchaseOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name phone email address')
      .populate('items.ingredient', 'name unit unitCost currentStock');
    if (!po) throw createError('Purchase order not found', 404);
    res.status(200).json({ status: 'success', data: { order: po } });
  } catch (error) { next(error); }
};

export const createPurchaseOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, ...rest } = req.body;

    // Calculate totals server-side
    const resolvedItems = items.map((item: any) => ({
      ...item,
      totalCost: item.orderedQty * item.unitCost,
    }));
    const subtotal = resolvedItems.reduce((s: number, i: any) => s + i.totalCost, 0);
    const tax = rest.tax ?? 0;
    const totalAmount = subtotal + tax;

    const po = await PurchaseOrder.create({
      ...rest,
      poNumber: generatePONumber(),
      items: resolvedItems,
      subtotal,
      totalAmount,
      createdBy: (req as any).user?._id,
    });

    res.status(201).json({ status: 'success', data: { order: po } });
  } catch (error) { next(error); }
};

export const updatePurchaseOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) throw createError('Purchase order not found', 404);

    const validTransitions: Record<string, string[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'cancelled'],
      approved: ['ordered', 'cancelled'],
      ordered: ['partially_received', 'received', 'cancelled'],
      partially_received: ['received'],
    };

    if (!validTransitions[po.status]?.includes(status)) {
      throw createError(`Cannot transition from '${po.status}' to '${status}'`, 400);
    }

    po.status = status;
    if (status === 'approved') po.approvedBy = (req as any).user?._id;
    await po.save();

    res.status(200).json({ status: 'success', data: { order: po } });
  } catch (error) { next(error); }
};

// ─── Receive Goods (GRN) ──────────────────────────────────────────────────────
export const receiveGoods = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  try {
    const { receivedItems, deliveryNote } = req.body;
    // receivedItems: [{ ingredientId, receivedQty, unitCost }]

    const po = await PurchaseOrder.findById(req.params.id).session(dbSession);
    if (!po) throw createError('Purchase order not found', 404);
    if (!['ordered', 'partially_received'].includes(po.status)) {
      throw createError(`Cannot receive goods for a PO with status: ${po.status}`, 400);
    }

    for (const received of receivedItems) {
      const poItem = po.items.find((i) => i.ingredient.toString() === received.ingredientId);
      if (!poItem) continue;

      poItem.receivedQty = (poItem.receivedQty ?? 0) + received.receivedQty;

      // Update ingredient stock atomically
      const ingredient = await Ingredient.findById(received.ingredientId).session(dbSession);
      if (!ingredient) continue;

      const stockBefore = ingredient.currentStock;
      ingredient.currentStock += received.receivedQty;
      if (received.unitCost) ingredient.unitCost = received.unitCost;
      await ingredient.save({ session: dbSession });

      await StockMovement.create([{
        organizationId: po.organizationId,
        branchId: po.branchId,
        ingredient: ingredient._id,
        movementType: 'stock_in',
        quantity: received.receivedQty,
        unitCost: received.unitCost ?? ingredient.unitCost,
        totalCost: received.receivedQty * (received.unitCost ?? ingredient.unitCost),
        stockBefore,
        stockAfter: ingredient.currentStock,
        purchaseOrderId: po._id,
        referenceType: 'PurchaseOrder',
        referenceId: po._id,
        performedBy: (req as any).user?._id,
        note: `GRN from PO ${po.poNumber}`,
      }], { session: dbSession });
    }

    // Determine new PO status
    const allReceived = po.items.every((i) => (i.receivedQty ?? 0) >= i.orderedQty);
    po.status = allReceived ? 'received' : 'partially_received';
    po.actualDelivery = new Date();
    po.deliveryNote = deliveryNote;
    po.receivedBy = (req as any).user?._id;
    await po.save({ session: dbSession });

    await dbSession.commitTransaction();
    res.status(200).json({ status: 'success', message: `Goods received — PO is now ${po.status}`, data: { order: po } });
  } catch (error) {
    await dbSession.abortTransaction();
    next(error);
  } finally {
    dbSession.endSession();
  }
};

// ─── Procurement Stats ────────────────────────────────────────────────────────
export const getProcurementStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.query;
    const filter: Record<string, any> = {};
    if (branchId) filter.branchId = branchId;

    const [totalPOs, pendingPOs, totalSpend, supplierCount] = await Promise.all([
      PurchaseOrder.countDocuments(filter),
      PurchaseOrder.countDocuments({ ...filter, status: { $in: ['submitted', 'approved', 'ordered'] } }),
      PurchaseOrder.aggregate([
        { $match: { ...filter, status: { $in: ['received', 'partially_received'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Supplier.countDocuments({ ...filter, isActive: true }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalPOs,
          pendingPOs,
          totalSpend: totalSpend[0]?.total ?? 0,
          supplierCount,
        },
      },
    });
  } catch (error) { next(error); }
};

