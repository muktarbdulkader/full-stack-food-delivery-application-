import { Request, Response, NextFunction } from 'express';
import { Food } from '../models/Food.model';
import { createError } from '../middlewares/error.middleware';

export const getAllFoods = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, available } = req.query;
    
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';

    const foods = await Food.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: foods.length,
      data: { foods },
    });
  } catch (error) {
    next(error);
  }
};

export const getFoodById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      throw createError('Food not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { food },
    });
  } catch (error) {
    next(error);
  }
};

export const createFood = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, price, category, image, isAvailable } = req.body;

    const food = await Food.create({
      name,
      description,
      price,
      category,
      image,
      isAvailable,
    });

    res.status(201).json({
      status: 'success',
      data: { food },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFood = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!food) {
      throw createError('Food not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { food },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFood = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      throw createError('Food not found', 404);
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
