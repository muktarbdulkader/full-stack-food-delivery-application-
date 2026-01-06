import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User.model';
import { Admin, IAdmin } from '../models/Admin.model';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { createError } from '../middlewares/error.middleware';
import { env } from '../config/env';

interface AuthRequest extends Request {
  user?: IUser | IAdmin;
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, address, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createError('User already exists with this email', 400);
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
    });

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, adminCode } = req.body;

    // Verify admin secret code
    if (adminCode !== env.adminSecretCode) {
      throw createError('Invalid admin registration code', 403);
    }

    // Check if admin already exists (separate from users)
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw createError('Admin already exists with this email', 400);
    }

    const hashedPassword = await hashPassword(password);

    // Create admin in separate Admin collection
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    });

    const token = generateToken({
      userId: admin._id.toString(),
      role: admin.role,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('Please provide email and password', 400);
    }

    // First check in User collection
    let user = await User.findOne({ email });
    let isAdmin = false;

    // If not found in User, check Admin collection
    if (!user) {
      const admin = await Admin.findOne({ email });
      if (admin) {
        user = admin as unknown as typeof user;
        isAdmin = true;
      }
    }

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw createError('Invalid credentials', 401);
    }

    const token = generateToken({
      userId: user._id.toString(),
      role: isAdmin ? 'admin' : user.role,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: isAdmin ? 'admin' : user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    res.status(200).json({
      status: 'success',
      data: { 
        user: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin-specific login - only checks Admin collection
export const adminLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('Please provide email and password', 400);
    }

    // Only check Admin collection
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw createError('Invalid admin credentials', 401);
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      throw createError('Invalid admin credentials', 401);
    }

    const token = generateToken({
      userId: admin._id.toString(),
      role: 'admin',
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: 'admin',
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
