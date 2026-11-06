import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { createError } from './error.middleware';
import { UserRole } from '../models/User.model';

export const authorizeRoles = (...allowedRoles: (UserRole | string)[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const userRole = req.user.role;

    // Super admin & business owner bypass specific role limits
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return next(
      createError(`Access denied: role '${userRole}' is not authorized for this resource`, 403)
    );
  };
};

export const authorizePermissions = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const userRole = req.user.role;
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }

    const userPermissions = (req.user as any).permissions || [];
    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.includes(perm) || userPermissions.includes('all')
    );

    if (hasAll) {
      return next();
    }

    return next(
      createError('Access denied: insufficient permission privileges', 403)
    );
  };
};

export const scopeToBranch = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const branchHeader = req.headers['x-branch-id'] as string;
  const orgHeader = req.headers['x-organization-id'] as string;

  if (branchHeader) {
    (req as any).targetBranchId = branchHeader;
  }
  if (orgHeader) {
    (req as any).targetOrganizationId = orgHeader;
  }

  // If user belongs to a specific branch and is not super_admin, lock target to their branch
  if (req.user && (req.user as any).branchId) {
    const userRole = req.user.role;
    if (userRole !== 'super_admin' && userRole !== 'business_owner') {
      (req as any).targetBranchId = (req.user as any).branchId.toString();
    }
  }

  next();
};

