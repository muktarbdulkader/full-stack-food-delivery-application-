import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, IUser, UserRole } from '../models/User.model';
import { StaffInvitation } from '../models/StaffInvitation.model';
import { StaffRegistrationRequest } from '../models/StaffRegistrationRequest.model';
import { StaffSession } from '../models/StaffSession.model';
import { AuditLog } from '../models/AuditLog.model';
import { Organization } from '../models/Organization.model';
import { Branch } from '../models/Branch.model';
import { RestaurantTable } from '../models/RestaurantTable.model';
import { Account } from '../models/Account.model';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { createError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { generateSecureQRToken, generateTableQRCodeDataUrl } from '../services/qr.service';

// Allowed staff roles
const STAFF_ROLES: UserRole[] = [
  'business_owner',
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
    case 'business_owner':
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
 * Register New Restaurant Organization (Owner Registration)
 * Creates new Organization, primary Branch, Owner User, default Tables & Chart of Accounts
 */
export const registerRestaurantOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      ownerName,
      email,
      password,
      restaurantName,
      phone,
      businessType = 'restaurant',
      city = 'Addis Ababa',
      country = 'Ethiopia',
      street,
      currency = 'ETB',
    } = req.body;

    if (!ownerName || !email || !password || !restaurantName) {
      throw createError('Owner name, email, password, and restaurant name are required', 400);
    }

    if (password.length < 6) {
      throw createError('Password must be at least 6 characters', 400);
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw createError('An account with this email already exists', 400);
    }

    // Generate unique slug
    let baseSlug = restaurantName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'restaurant';
    let slug = baseSlug;
    let count = 1;
    while (await Organization.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    // 1. Create Organization
    const organization = await Organization.create({
      name: restaurantName.trim(),
      slug,
      businessType,
      contactEmail: cleanEmail,
      contactPhone: phone || '+251 911 000 000',
      address: {
        street: street || 'Central District',
        city: city || 'Addis Ababa',
        country: country || 'Ethiopia',
      },
      settings: {
        taxRate: 0.15,
        serviceChargeRate: 0.05,
        currency: currency || 'ETB',
        allowGuestOrdering: true,
        autoAcceptOrders: true,
        kdsEnabled: true,
      },
      isActive: true,
    });

    // 2. Create Default Primary Branch
    const branchCode = `${baseSlug.substring(0, 3).toUpperCase()}-01`;
    const branch = await Branch.create({
      organizationId: organization._id,
      name: 'Main Branch',
      code: branchCode,
      phone: phone || '+251 911 000 000',
      email: cleanEmail,
      address: {
        street: street || 'Main Boulevard',
        city: city || 'Addis Ababa',
        country: country || 'Ethiopia',
      },
      operatingHours: {
        openTime: '07:00',
        closeTime: '23:00',
        daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
      diningAreas: ['Main Dining Hall', 'Outdoor Patio', 'VIP Lounge'],
      isMainBranch: true,
      isActive: true,
    });

    // 3. Create Owner User
    const hashedPassword = await hashPassword(password);
    const ownerUser = await User.create({
      name: ownerName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'business_owner',
      organizationId: organization._id,
      branchId: branch._id,
      assignedBranches: [branch._id],
      permissions: ['all'],
      phone: phone || '',
      registrationStatus: 'active',
      employmentStatus: 'active',
      isActive: true,
      emailVerified: true,
    });

    // Update branch manager
    branch.managerId = ownerUser._id;
    await branch.save();

    // 4. Create Initial Dine-in Tables (Tables 01-05) with QR codes
    const tableConfigs = [
      { number: '01', name: 'Table 01 - Main Hall', area: 'Main Dining Hall', cap: 4 },
      { number: '02', name: 'Table 02 - Intimate Booth', area: 'Main Dining Hall', cap: 2 },
      { number: '03', name: 'Table 03 - Window View', area: 'Main Dining Hall', cap: 4 },
      { number: '04', name: 'Table 04 - Garden Patio', area: 'Outdoor Patio', cap: 6 },
      { number: '05', name: 'Table 05 - Presidential Suite', area: 'VIP Lounge', cap: 8 },
    ];

    for (const t of tableConfigs) {
      const qrToken = generateSecureQRToken();
      const qrCodeUrl = await generateTableQRCodeDataUrl(qrToken);
      await RestaurantTable.create({
        organizationId: organization._id,
        branchId: branch._id,
        tableNumber: t.number,
        name: t.name,
        diningArea: t.area,
        capacity: t.cap,
        status: 'available',
        qrToken,
        qrCodeUrl,
        isActive: true,
      });
    }

    // 5. Initialize Chart of Accounts for ERP Accounting
    const defaultAccounts = [
      { code: '1010', name: 'Cash on Hand', category: 'asset' as const, balance: 10000 },
      { code: '1020', name: 'Bank & Mobile Money (Telebirr/CBE)', category: 'asset' as const, balance: 50000 },
      { code: '1030', name: 'Raw Material Inventory Asset', category: 'asset' as const, balance: 25000 },
      { code: '2010', name: 'Accounts Payable (Vendors)', category: 'liability' as const, balance: 5000 },
      { code: '4010', name: 'Food & Beverage Dine-In Revenue', category: 'revenue' as const, balance: 0 },
      { code: '5010', name: 'Cost of Goods Sold (Ingredients)', category: 'expense' as const, balance: 0 },
      { code: '5020', name: 'Staff Salaries & Wages', category: 'expense' as const, balance: 0 },
    ];
    for (const acc of defaultAccounts) {
      await Account.create({
        ...acc,
        organizationId: organization._id,
        branchId: branch._id,
        isSystemAccount: true,
      });
    }

    // 6. Record Audit Log
    await AuditLog.create({
      userId: ownerUser._id,
      userName: ownerUser.name,
      userRole: ownerUser.role,
      action: 'ORGANIZATION_REGISTERED',
      entityType: 'Organization',
      entityId: organization._id.toString(),
      branchId: branch._id,
      organizationId: organization._id,
      ipAddress: req.ip,
      details: {
        organizationName: organization.name,
        slug: organization.slug,
        primaryBranch: branch.name,
      },
    });

    // 7. Generate Token
    const token = generateToken({ userId: ownerUser._id.toString(), role: ownerUser.role });
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const hashedRefresh = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    await StaffSession.create({
      userId: ownerUser._id,
      refreshToken: hashedRefresh,
      deviceInfo: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip || req.socket.remoteAddress,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `🎉 Welcome to FoodHub ERP! Restaurant '${organization.name}' has been created successfully.`,
      token,
      refreshToken: rawRefreshToken,
      user: {
        _id: ownerUser._id,
        name: ownerUser.name,
        email: ownerUser.email,
        role: ownerUser.role,
        organizationId: organization._id,
        branchId: branch._id,
        assignedBranches: [branch._id],
        permissions: ['all'],
        portal: '/admin',
      },
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
      branch: {
        _id: branch._id,
        name: branch.name,
        code: branch.code,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Public List of Active Organizations and Branches for Staff Registration
 */
export const getPublicOrganizations = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizations = await Organization.find({ isActive: true })
      .select('_id name slug businessType')
      .lean();

    const orgIds = organizations.map((o) => o._id);
    const branches = await Branch.find({ organizationId: { $in: orgIds }, isActive: true })
      .select('_id organizationId name code diningAreas')
      .lean();

    const result = organizations.map((org) => ({
      ...org,
      branches: branches.filter((b) => b.organizationId.toString() === org._id.toString()),
    }));

    res.json({
      success: true,
      organizations: result,
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



