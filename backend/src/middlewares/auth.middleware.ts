import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User, IUser } from '../models/User.model';
import { Admin, IAdmin } from '../models/Admin.model';
import { createError } from './error.middleware';

export interface AuthRequest extends Request {
  user?: IUser | IAdmin;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Not authorized, no token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // First check User collection
    let user: IUser | IAdmin | null = await User.findById(decoded.userId).select('-password');
    
    // If not found in User, check Admin collection
    if (!user) {
      user = await Admin.findById(decoded.userId).select('-password');
    }

    if (!user) {
      throw createError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      next(createError('Invalid token', 401));
    } else if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(createError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(createError('Access denied. Admin only.', 403));
  }
};
