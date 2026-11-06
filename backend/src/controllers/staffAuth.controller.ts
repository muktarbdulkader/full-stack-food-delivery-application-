import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, IUser, UserRole } from '../models/User.model';
import { StaffInvitation } from '../models/StaffInvitation.model';
import { StaffRegistrationRequest } from '../models/StaffRegistrationRequest.model';
import { StaffSession } from '../models/StaffSession.model';
import { AuditLog } from '../models/AuditLog.model';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { createError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

// Allowed staff roles
const STAFF_ROLES: UserRole[] = [
  'cashier',
  'waiter',
  'chef',
  'kitchen_staff' as any,
  'driver',
  'delivery_manager',
  'inventory_manager',
  'branch_manager',
  'restaurant_admin',
  'accountant',
  'hr_manager',
  'admin',
  'super_admin',
];

// Helper to determine destination portal based on role
export const getPortalForRole = (role: string): string => {
  switch (role) {
    case 'cashier':
      return '/cashier';
    case 'waiter':
      return '/waiter';
    case 'chef':
    case 'kitchen_staff':
      return '/kds';
    case 'driver':
    case 'delivery_manager':
      return '/delivery';
    case 'admin':
    case 'super_admin':
    case 'restaurant_admin':
    case 'branch_manager':
      return '/admin';
    default:
      return '/cashier';
  }
};

/**
 * Staff Login with lockout protection & session tracking
 */
export const staffLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw createError('Invalid staff credentials', 401);
    }

    // Role check - must be a staff or admin role
    if (!STAFF_ROLES.includes(user.role)) {
      throw createError('Access denied: not an authorized staff account', 403);
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      throw createError(
        `Account temporarily locked due to failed attempts. Try again in ${waitMinutes} minute(s).`,
        423
      );
    }

    // Check account status
    if (user.registrationStatus === 'suspended' || user.isActive === false) {
      throw createError('Your staff account is suspended. Contact administration.', 403);
    }
    if (user.registrationStatus === 'pending') {
      throw createError('Your staff registration request is still pending administrator approval.', 403);
    }
    if (user.registrationStatus === 'rejected') {
      throw createError('Your staff account registration was rejected.', 403);
    }

    // Verify password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await user.save();
      throw createError('Invalid staff credentials', 401);
    }

    // Successful login: reset attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken({ userId: user._id.toString(), role: user.role });
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const hashedRefresh = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    // Create session record
    await StaffSession.create({
      userId: user._id,
      refreshToken: hashedRefresh,
      deviceInfo: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip || req.socket.remoteAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true,
    });

    // Record Audit Log
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'STAFF_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      branchId: user.branchId,
      organizationId: user.organizationId,
      ipAddress: req.ip,
      details: { role: user.role, portal: getPortalForRole(user.role) },
    });

    res.json({
      success: true,
      token,
      refreshToken: rawRefreshToken,
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        organizationId: user.organizationId,
        permissions: user.permissions || [],
        assignedBranches: user.assignedBranches || [],
        portal: getPortalForRole(user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Staff Self-Registration Request
 */
export const submitRegistrationRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, phone, requestedRole, requestedBranchId, password } = req.body;

    if (!name || !email || !password || !requestedRole) {
      throw createError('Name, email, password and requested role are required', 400);
    }

    // Disallow self-requesting administrative privileges
    if (['admin', 'super_admin', 'business_owner'].includes(requestedRole)) {
      throw createError('Administrative roles cannot be self-requested', 400);
    }

    // Check if user already exists in active Users
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw createError('An account with this email already exists', 400);
    }

    // Check if pending request already exists
    const existingRequest = await StaffRegistrationRequest.findOne({
      email: email.toLowerCase().trim(),
      status: 'pending',
    });
    if (existingRequest) {
      throw createError('A registration request for this email is already awaiting approval', 400);
    }

    const hashedPassword = await hashPassword(password);

    const request = await StaffRegistrationRequest.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      hashedPassword,
      requestedRole,
      requestedBranchId,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully. It will be reviewed by an administrator.',
      requestId: request._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept Admin Invitation and Set Password
 */
export const acceptInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password, name, phone } = req.body;

    if (!token || !password) {
      throw createError('Token and password are required', 400);
    }

    // Hash token to look up invitation
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await StaffInvitation.findOne({
      token: hashedToken,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw createError('Invitation link is invalid, expired, or has already been used', 400);
    }

    const hashedPassword = await hashPassword(password);

    // Check if user exists or create new
    let user = await User.findOne({ email: invitation.invitedEmail });

    if (user) {
      user.password = hashedPassword;
      user.role = invitation.role as UserRole;
      user.branchId = invitation.branchId;
      user.organizationId = invitation.organizationId;
      user.permissions = invitation.permissions;
      user.registrationStatus = 'active';
      user.emailVerified = true;
      user.isActive = true;
      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();
    } else {
      // Generate employee ID e.g. EMP-1002
      const empCount = await User.countDocuments();
      const employeeId = `EMP-${1000 + empCount + 1}`;

      user = await User.create({
        name: name || invitation.invitedName,
        email: invitation.invitedEmail,
        password: hashedPassword,
        role: invitation.role,
        branchId: invitation.branchId,
        organizationId: invitation.organizationId,
        permissions: invitation.permissions,
        employeeId,
        phone,
        registrationStatus: 'active',
        emailVerified: true,
        isActive: true,
        invitedBy: invitation.invitedBy,
      });
    }

    // Mark invitation as accepted
    invitation.status = 'accepted';
    invitation.usedAt = new Date();
    await invitation.save();

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'INVITATION_ACCEPTED',
      entityType: 'User',
      entityId: user._id.toString(),
      branchId: user.branchId,
      organizationId: user.organizationId,
      details: { role: user.role },
    });

    const authToken = generateToken({ userId: user._id.toString(), role: user.role });

    res.json({
      success: true,
      message: 'Account activated successfully. Welcome to FoodHub Staff!',
      token: authToken,
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        portal: getPortalForRole(user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Staff Logout - Revoke Session
 */
export const staffLogout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await StaffSession.updateOne(
        { refreshToken: hashedRefresh },
        { isActive: false, revokedAt: new Date() }
      );
    }

    if (req.user) {
      await AuditLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'STAFF_LOGOUT',
        entityType: 'User',
        entityId: req.user._id.toString(),
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw createError('Refresh token required', 400);
    }

    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const session = await StaffSession.findOne({
      refreshToken: hashed,
      isActive: true,
      expiresAt: { $gt: new Date() },
    }).populate('userId');

    if (!session || !session.userId) {
      throw createError('Invalid or expired refresh token', 401);
    }

    const user = session.userId as any as IUser;
    if (!user.isActive || user.registrationStatus === 'suspended') {
      throw createError('Staff account has been suspended', 403);
    }

    const token = generateToken({ userId: user._id.toString(), role: user.role });

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current staff profile & roles
 */
export const getStaffMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw createError('Not authorized', 401);
    }

    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('branchId', 'name address code')
      .populate('organizationId', 'name');

    if (!user) {
      throw createError('Staff user not found', 404);
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        portal: getPortalForRole(user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

