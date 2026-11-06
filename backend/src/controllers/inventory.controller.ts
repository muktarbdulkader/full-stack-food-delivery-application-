import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Ingredient } from '../models/Ingredient.model';
import { StockMovement } from '../models/StockMovement.model';
import { createError } from '../middlewares/error.middleware';

// ─── GET All Ingredients ──────────────────────────────────────────────────────
export const getIngredients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, category, lowStock, search } = req.query;
    const filter: Record<string, any> = { isActive: true };
    if (branchId) filter.branchId = branchId;
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const ingredients = await Ingredient.find(filter)
      .populate('supplierId', 'name phone')
      .sort({ name: 1 })
      .lean();

    // Apply low-stock filter after query (virtual field)
    const result = lowStock === 'true'
      ? ingredients.filter((i) => i.currentStock <= i.minimumStock)
      : ingredients;

    res.status(200).json({ status: 'success', data: { ingredients: result, total: result.length } });
  } catch (error) { next(error); }
};

// ─── GET Single Ingredient ────────────────────────────────────────────────────
export const getIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ingredient = await Ingredient.findById(req.params.id).populate('supplierId', 'name phone email');
    if (!ingredient) throw createError('Ingredient not found', 404);
    res.status(200).json({ status: 'success', data: { ingredient } });
  } catch (error) { next(error); }
};

// ─── CREATE Ingredient ────────────────────────────────────────────────────────
export const createIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ingredient = await Ingredient.create(req.body);

    // Record opening stock movement if initial stock > 0
    if (ingredient.currentStock > 0) {
      await StockMovement.create({
        organizationId: ingredient.organizationId,
        branchId: ingredient.branchId,
        ingredient: ingredient._id,
        movementType: 'opening_stock',
        quantity: ingredient.currentStock,
        unitCost: ingredient.unitCost,
        totalCost: ingredient.currentStock * ingredient.unitCost,
        stockBefore: 0,
        stockAfter: ingredient.currentStock,
        note: 'Opening stock entry',
      });
    }

    res.status(201).json({ status: 'success', data: { ingredient } });
  } catch (error) { next(error); }
};

// ─── UPDATE Ingredient ────────────────────────────────────────────────────────
export const updateIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!ingredient) throw createError('Ingredient not found', 404);
    res.status(200).json({ status: 'success', data: { ingredient } });
  } catch (error) { next(error); }
};

// ─── DELETE Ingredient (soft) ─────────────────────────────────────────────────
export const deleteIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!ingredient) throw createError('Ingredient not found', 404);
    res.status(200).json({ status: 'success', message: 'Ingredient deactivated' });
  } catch (error) { next(error); }
};

// ─── STOCK IN ─────────────────────────────────────────────────────────────────
export const stockIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { quantity, unitCost, note, purchaseOrderId, batchNumber, expiryDate } = req.body;
    if (!quantity || quantity <= 0) throw createError('Quantity must be positive', 400);

    const ingredient = await Ingredient.findById(req.params.id).session(session);
    if (!ingredient) throw createError('Ingredient not found', 404);

    const stockBefore = ingredient.currentStock;
    ingredient.currentStock += quantity;
    if (unitCost) ingredient.unitCost = unitCost;
    if (batchNumber) ingredient.batchNumber = batchNumber;
    if (expiryDate) ingredient.expiryDate = new Date(expiryDate);
    await ingredient.save({ session });

    await StockMovement.create([{
      organizationId: ingredient.organizationId,
      branchId: ingredient.branchId,
      ingredient: ingredient._id,
      movementType: 'stock_in',
      quantity,
      unitCost: unitCost ?? ingredient.unitCost,
      totalCost: quantity * (unitCost ?? ingredient.unitCost),
      stockBefore,
      stockAfter: ingredient.currentStock,
      purchaseOrderId,
      performedBy: (req as any).user?._id,
      note: note || 'Stock received',
    }], { session });

    await session.commitTransaction();
    res.status(200).json({ status: 'success', message: `Stock updated: ${stockBefore} → ${ingredient.currentStock} ${ingredient.unit}`, data: { ingredient } });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─── STOCK OUT (manual) ───────────────────────────────────────────────────────
export const stockOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { quantity, movementType = 'stock_out', note } = req.body;
    if (!quantity || quantity <= 0) throw createError('Quantity must be positive', 400);

    const ingredient = await Ingredient.findById(req.params.id).session(session);
    if (!ingredient) throw createError('Ingredient not found', 404);
    if (ingredient.currentStock < quantity) throw createError(`Insufficient stock. Available: ${ingredient.currentStock} ${ingredient.unit}`, 400);

    const stockBefore = ingredient.currentStock;
    ingredient.currentStock -= quantity;
    await ingredient.save({ session });

    await StockMovement.create([{
      organizationId: ingredient.organizationId,
      branchId: ingredient.branchId,
      ingredient: ingredient._id,
      movementType,
      quantity: -quantity,
      unitCost: ingredient.unitCost,
      totalCost: quantity * ingredient.unitCost,
      stockBefore,
      stockAfter: ingredient.currentStock,
      performedBy: (req as any).user?._id,
      note,
    }], { session });

    await session.commitTransaction();
    res.status(200).json({ status: 'success', message: `Stock reduced: ${stockBefore} → ${ingredient.currentStock} ${ingredient.unit}`, data: { ingredient } });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─── ADJUST Stock ─────────────────────────────────────────────────────────────
export const adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { newQuantity, note } = req.body;
    if (newQuantity === undefined || newQuantity < 0) throw createError('New quantity must be >= 0', 400);

    const ingredient = await Ingredient.findById(req.params.id).session(session);
    if (!ingredient) throw createError('Ingredient not found', 404);

    const stockBefore = ingredient.currentStock;
    const diff = newQuantity - stockBefore;
    ingredient.currentStock = newQuantity;
    await ingredient.save({ session });

    await StockMovement.create([{
      organizationId: ingredient.organizationId,
      branchId: ingredient.branchId,
      ingredient: ingredient._id,
      movementType: 'adjustment',
      quantity: diff,
      unitCost: ingredient.unitCost,
      totalCost: Math.abs(diff) * ingredient.unitCost,
      stockBefore,
      stockAfter: newQuantity,
      performedBy: (req as any).user?._id,
      note: note || `Manual adjustment: ${stockBefore} → ${newQuantity}`,
    }], { session });

    await session.commitTransaction();
    res.status(200).json({ status: 'success', message: `Stock adjusted to ${newQuantity} ${ingredient.unit}`, data: { ingredient } });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// ─── GET Stock Movements ──────────────────────────────────────────────────────
export const getStockMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ingredientId, branchId, movementType, page = '1', limit = '30' } = req.query;
    const filter: Record<string, any> = {};
    if (ingredientId) filter.ingredient = ingredientId;
    if (branchId) filter.branchId = branchId;
    if (movementType) filter.movementType = movementType;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('ingredient', 'name unit')
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      StockMovement.countDocuments(filter),
    ]);

    res.status(200).json({ status: 'success', data: { movements, pagination: { total, page: parseInt(page as string), pages: Math.ceil(total / parseInt(limit as string)) } } });
  } catch (error) { next(error); }
};

// ─── Inventory Dashboard Stats ────────────────────────────────────────────────
export const getInventoryStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.query;
    const filter: Record<string, any> = { isActive: true };
    if (branchId) filter.branchId = branchId;

    const all = await Ingredient.find(filter).lean();
    const totalItems = all.length;
    const lowStock = all.filter((i) => i.currentStock <= i.minimumStock).length;
    const outOfStock = all.filter((i) => i.currentStock === 0).length;
    const totalValue = all.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0);
    const expiringSoon = all.filter((i) => {
      if (!i.expiryDate) return false;
      const daysLeft = (new Date(i.expiryDate).getTime() - Date.now()) / 86400000;
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    res.status(200).json({ status: 'success', data: { stats: { totalItems, lowStock, outOfStock, totalValue, expiringSoon } } });
  } catch (error) { next(error); }
};

