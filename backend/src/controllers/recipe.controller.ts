import { Request, Response, NextFunction } from 'express';
import { Recipe } from '../models/Recipe.model';
import { Ingredient } from '../models/Ingredient.model';
import { createError } from '../middlewares/error.middleware';

// ─── Helper: recalculate food cost from ingredients ───────────────────────────
const calculateFoodCost = async (
  ingredients: { ingredient: any; quantity: number; wastagePercent?: number }[]
): Promise<number> => {
  let cost = 0;
  for (const item of ingredients) {
    const ing = await Ingredient.findById(item.ingredient).lean();
    if (ing) {
      const qty = item.quantity * (1 + (item.wastagePercent ?? 0) / 100);
      cost += qty * ing.unitCost;
    }
  }
  return parseFloat(cost.toFixed(2));
};

// ─── GET All Recipes ──────────────────────────────────────────────────────────
export const getRecipes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, search } = req.query;
    const filter: Record<string, any> = { isActive: true };
    if (branchId) filter.branchId = branchId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const recipes = await Recipe.find(filter)
      .populate('food', 'name image category price')
      .populate('ingredients.ingredient', 'name unit unitCost')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({ status: 'success', data: { recipes } });
  } catch (error) { next(error); }
};

// ─── GET Single Recipe ────────────────────────────────────────────────────────
export const getRecipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('food', 'name image category price')
      .populate('ingredients.ingredient', 'name unit unitCost currentStock minimumStock');
    if (!recipe) throw createError('Recipe not found', 404);
    res.status(200).json({ status: 'success', data: { recipe } });
  } catch (error) { next(error); }
};

// ─── CREATE Recipe ────────────────────────────────────────────────────────────
export const createRecipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ingredients, sellingPrice, ...rest } = req.body;

    const foodCost = await calculateFoodCost(ingredients);
    const grossProfit = parseFloat((sellingPrice - foodCost).toFixed(2));
    const profitMargin = sellingPrice > 0 ? parseFloat(((grossProfit / sellingPrice) * 100).toFixed(2)) : 0;

    const recipe = await Recipe.create({
      ...rest,
      ingredients,
      sellingPrice,
      foodCost,
      grossProfit,
      profitMargin,
      versionHistory: [{
        version: 1,
        ingredients,
        foodCost,
        createdAt: new Date(),
        note: 'Initial version',
      }],
    });

    res.status(201).json({ status: 'success', data: { recipe } });
  } catch (error) { next(error); }
};

// ─── UPDATE Recipe ────────────────────────────────────────────────────────────
export const updateRecipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) throw createError('Recipe not found', 404);

    const { ingredients, sellingPrice, versionNote, ...rest } = req.body;

    // Recalculate costs
    const foodCost = await calculateFoodCost(ingredients ?? recipe.ingredients);
    const sp = sellingPrice ?? recipe.sellingPrice;
    const grossProfit = parseFloat((sp - foodCost).toFixed(2));
    const profitMargin = sp > 0 ? parseFloat(((grossProfit / sp) * 100).toFixed(2)) : 0;

    // Save version history
    const newVersion = (recipe.versionHistory?.length ?? 0) + 1;
    recipe.versionHistory.push({
      version: newVersion,
      ingredients: ingredients ?? recipe.ingredients,
      foodCost,
      createdAt: new Date(),
      note: versionNote ?? `Version ${newVersion} update`,
    });

    Object.assign(recipe, { ...rest, ingredients: ingredients ?? recipe.ingredients, sellingPrice: sp, foodCost, grossProfit, profitMargin });
    await recipe.save();

    res.status(200).json({ status: 'success', data: { recipe } });
  } catch (error) { next(error); }
};

// ─── DELETE Recipe (soft) ─────────────────────────────────────────────────────
export const deleteRecipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!recipe) throw createError('Recipe not found', 404);
    res.status(200).json({ status: 'success', message: 'Recipe deactivated' });
  } catch (error) { next(error); }
};

// ─── RECALCULATE Recipe Cost ──────────────────────────────────────────────────
export const recalculateRecipeCost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) throw createError('Recipe not found', 404);

    const foodCost = await calculateFoodCost(recipe.ingredients as any);
    const grossProfit = parseFloat((recipe.sellingPrice - foodCost).toFixed(2));
    const profitMargin = recipe.sellingPrice > 0 ? parseFloat(((grossProfit / recipe.sellingPrice) * 100).toFixed(2)) : 0;

    recipe.foodCost = foodCost;
    recipe.grossProfit = grossProfit;
    recipe.profitMargin = profitMargin;
    await recipe.save();

    res.status(200).json({ status: 'success', message: 'Recipe cost recalculated', data: { recipe } });
  } catch (error) { next(error); }
};

// ─── GET Recipe Cost Summary ──────────────────────────────────────────────────
export const getRecipeCostSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.query;
    const filter: Record<string, any> = { isActive: true };
    if (branchId) filter.branchId = branchId;

    const recipes = await Recipe.find(filter).lean();
    const avgMargin = recipes.length > 0 ? recipes.reduce((s, r) => s + r.profitMargin, 0) / recipes.length : 0;
    const highMargin = recipes.filter((r) => r.profitMargin >= 60).length;
    const lowMargin = recipes.filter((r) => r.profitMargin < 30).length;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalRecipes: recipes.length,
          avgMargin: parseFloat(avgMargin.toFixed(2)),
          highMargin,
          lowMargin,
        },
      },
    });
  } catch (error) { next(error); }
};

