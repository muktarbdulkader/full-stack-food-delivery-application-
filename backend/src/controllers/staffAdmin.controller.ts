import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, IUser, UserRole } from '../models/User.model';
import { StaffInvitation } from '../models/StaffInvitation.model';
import { StaffRegistrationRequest } from '../models/StaffRegistrationRequest.model';
import { StaffSession } from '../models/StaffSession.model';
import { AuditLog } from '../models/AuditLog.model';
import { hashPassword } from '../utils/hash';
import { createError } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { sendEmail } from '../utils/email';

/**
 * List all staff members
 */
export const getStaffList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { role, branchId, status, search, page = '1', limit = '50' } = req.query;

    const query: Record<string, any> = {
      role: { $ne: 'user' }, // Only non-customer roles
    };

    // Strict tenant isolation: Scope to caller's organization
    if (req.user?.role !== 'super_admin' && req.user?.organizationId) {
      query.organizationId = req.user.organizationId;
    }

    if (role && role !== 'all') {
      query.role = role;
    }
    if (branchId) {
      query.branchId = branchId;
    }
    if (status) {
      query.registrationStatus = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
        { employeeId: { $regex: search as string, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [staff, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('branchId', 'name code')
        .populate('organizationId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      staff,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invite staff member via email
 */
export const inviteStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, name, role, branchId, organizationId, permissions } = req.body;

    if (!email || !name || !role) {
      throw createError('Email, name, and role are required', 400);
    }

    // Check if email already in use by active user
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing && existing.isActive) {
      throw createError('An active staff or customer account already exists with this email', 400);
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Revoke any previous pending invitations for this email
    await StaffInvitation.updateMany(
      { invitedEmail: email.toLowerCase().trim(), status: 'pending' },
      { status: 'revoked', revokedAt: new Date() }
    );

    const invitation = await StaffInvitation.create({
      invitedEmail: email.toLowerCase().trim(),
      invitedName: name.trim(),
      invitedBy: req.user!._id,
      role,
      branchId,
      organizationId,
      permissions: permissions || [],
      token: hashedToken,
      expiresAt,
      status: 'pending',
    });

    // Send invitation email
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/staff/accept-invitation?token=${rawToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">FoodHub ERP Invitation</h1>
          <p style="margin-top: 8px; opacity: 0.9;">Staff Portal Access</p>
        </div>
        <div style="padding: 28px; background: white; color: #374151;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>You have been invited by FoodHub Administration to join as <strong>${role.toUpperCase()}</strong>.</p>
          <p>Click the secure button below to set up your password and access your workstation portal:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept Staff Invitation
            </a>
          </div>
          <p style="font-size: 13px; color: #6b7280;">This invitation link is single-use and will expire in 7 days.</p>
        </div>
      </div>
    `;

    await sendEmail(email, 'Invitation to join FoodHub Staff Portal', emailHtml);

    // Audit log
    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STAFF_INVITED',
      entityType: 'StaffInvitation',
      entityId: invitation._id.toString(),
      details: { email, role, branchId },
    });

    res.status(201).json({
      success: true,
      message: `Invitation successfully sent to ${email}`,
      invitationId: invitation._id,
      inviteLink, // Useful for testing/dev environments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct staff creation by admin
 */
export const createStaffDirect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role, branchId, organizationId, permissions, phone } = req.body;

    if (!name || !email || !password || !role) {
      throw createError('Name, email, password, and role are required', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw createError('An account with this email already exists', 400);
    }

    const hashedPassword = await hashPassword(password);
    const count = await User.countDocuments();
    const employeeId = `EMP-${1000 + count + 1}`;

    const newStaff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      branchId,
      organizationId,
      permissions: permissions || [],
      phone,
      employeeId,
      registrationStatus: 'active',
      emailVerified: true,
      isActive: true,
      invitedBy: req.user!._id,
    });

    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STAFF_CREATED_DIRECT',
      entityType: 'User',
      entityId: newStaff._id.toString(),
      details: { role, employeeId, email },
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        _id: newStaff._id,
        employeeId: newStaff.employeeId,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update staff member details / role / permissions / status
 */
export const updateStaffMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      role,
      branchId,
      permissions,
      phone,
      isActive,
      registrationStatus,
      employmentStatus,
      password,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw createError('Staff member not found', 404);
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (branchId !== undefined) user.branchId = branchId || undefined;
    if (permissions) user.permissions = permissions;
    if (phone !== undefined) user.phone = phone;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (registrationStatus) user.registrationStatus = registrationStatus;
    if (employmentStatus) user.employmentStatus = employmentStatus;

    if (password) {
      user.password = await hashPassword(password);
    }

    await user.save();

    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STAFF_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { role: user.role, isActive: user.isActive, status: user.registrationStatus },
    });

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      staff: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke active sessions for a staff member
 */
export const revokeStaffSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await StaffSession.updateMany(
      { userId: id, isActive: true },
      { isActive: false, revokedAt: new Date() }
    );

    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'STAFF_SESSIONS_REVOKED',
      entityType: 'User',
      entityId: id,
    });

    res.json({ success: true, message: 'All active sessions revoked for this staff member' });
  } catch (error) {
    next(error);
  }
};

/**
 * List registration requests
 */
export const getRegistrationRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: Record<string, any> = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    // Strict tenant isolation
    if (req.user?.role !== 'super_admin' && req.user?.organizationId) {
      filter.organizationId = req.user.organizationId;
    }

    const requests = await StaffRegistrationRequest.find(filter)
      .populate('requestedBranchId', 'name code')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve registration request (Prevents self-approval)
 */
export const approveRegistrationRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedRole, assignedBranchId, permissions } = req.body;

    const request = await StaffRegistrationRequest.findById(id);
    if (!request) {
      throw createError('Registration request not found', 404);
    }

    if (request.status !== 'pending') {
      throw createError(`Request is already ${request.status}`, 400);
    }

    // Prevent self-approval
    if (req.user && req.user.email === request.email) {
      throw createError('Self-approval is forbidden by security policy', 403);
    }

    // Generate unique employee ID
    const count = await User.countDocuments();
    const employeeId = `EMP-${1000 + count + 1}`;

    const roleToAssign = (assignedRole || request.requestedRole) as UserRole;
    const branchToAssign = assignedBranchId || request.requestedBranchId;

    const user = await User.create({
      name: request.name,
      email: request.email,
      phone: request.phone,
      password: request.hashedPassword,
      role: roleToAssign,
      branchId: branchToAssign,
      organizationId: request.organizationId,
      permissions: permissions || [],
      employeeId,
      registrationStatus: 'active',
      emailVerified: true,
      isActive: true,
    });

    request.status = 'approved';
    request.reviewedBy = req.user!._id;
    request.reviewedAt = new Date();
    await request.save();

    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'REGISTRATION_APPROVED',
      entityType: 'StaffRegistrationRequest',
      entityId: request._id.toString(),
      details: { assignedRole: roleToAssign, createdUserId: user._id.toString() },
    });

    res.json({
      success: true,
      message: 'Registration request approved and staff account activated',
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject registration request
 */
export const rejectRegistrationRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await StaffRegistrationRequest.findById(id);
    if (!request) {
      throw createError('Registration request not found', 404);
    }

    // Prevent self-rejection / self manipulation
    if (req.user && req.user.email === request.email) {
      throw createError('Action not permitted on own request', 403);
    }

    request.status = 'rejected';
    request.reviewedBy = req.user!._id;
    request.reviewedAt = new Date();
    request.rejectionReason = reason || 'Declined by administrator';
    await request.save();

    await AuditLog.create({
      userId: req.user!._id,
      userName: req.user!.name,
      userRole: req.user!.role,
      action: 'REGISTRATION_REJECTED',
      entityType: 'StaffRegistrationRequest',
      entityId: request._id.toString(),
      details: { reason },
    });

    res.json({ success: true, message: 'Registration request rejected' });
  } catch (error) {
    next(error);
  }
};

/**
 * List pending/sent invitations
 */
export const getInvitations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = {};
    if (req.user?.role !== 'super_admin' && req.user?.organizationId) {
      filter.organizationId = req.user.organizationId;
    }

    const invitations = await StaffInvitation.find(filter)
      .populate('invitedBy', 'name email')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, invitations });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke invitation
 */
export const revokeInvitation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const inv = await StaffInvitation.findById(id);
    if (!inv) throw createError('Invitation not found', 404);

    inv.status = 'revoked';
    inv.revokedAt = new Date();
    await inv.save();

    res.json({ success: true, message: 'Invitation revoked' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Staff Audit Activity Logs
 */
export const getStaffActivityLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, action, limit = '100' } = req.query;
    const query: Record<string, any> = {};

    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (req.user?.role !== 'super_admin' && req.user?.organizationId) {
      query.organizationId = req.user.organizationId;
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10));

    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

