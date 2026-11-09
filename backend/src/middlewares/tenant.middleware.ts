import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from './auth.middleware';
import { createError } from './error.middleware';

export interface TenantScopedRequest extends AuthRequest {
  tenantScope?: {
    organizationId?: mongoose.Types.ObjectId;
    branchId?: mongoose.Types.ObjectId;
  };
}

/**
 * Enforces strict multi-tenant isolation.
 * Guarantees that a user from Restaurant A can NEVER view or mutate records from Restaurant B.
 */
export const enforceTenantIsolation = (
  req: TenantScopedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const user = req.user as any;
    const userRole = user.role;

    // Super Admin has global override capability if explicitly passing organization header
    if (userRole === 'super_admin') {
      const targetOrg = req.headers['x-organization-id'] as string;
      const targetBranch = req.headers['x-branch-id'] as string;
      req.tenantScope = {
        organizationId: targetOrg ? new mongoose.Types.ObjectId(targetOrg) : user.organizationId,
        branchId: targetBranch ? new mongoose.Types.ObjectId(targetBranch) : user.branchId,
      };
      return next();
    }

    // Every tenant user MUST belong to an organization
    if (!user.organizationId) {
      return next(createError('User does not belong to any restaurant organization', 403));
    }

    const userOrgId = user.organizationId.toString();

    // IDOR Protection: Check if client passed a foreign organizationId in body/query/headers
    const foreignOrgInBody = req.body?.organizationId;
    const foreignOrgInQuery = req.query?.organizationId as string;
    const foreignOrgInHeader = req.headers['x-organization-id'] as string;

    const requestedOrg = foreignOrgInBody || foreignOrgInQuery || foreignOrgInHeader;
    if (requestedOrg && requestedOrg.toString() !== userOrgId) {
      return next(
        createError('Access denied: cross-tenant access violation detected', 403)
      );
    }

    // Branch scoping:
    // - Business Owner can switch between branches of their own organization
    // - Station staff (cashier, waiter, chef, driver) are strictly locked to their assigned branchId
    let branchId: mongoose.Types.ObjectId | undefined = user.branchId;

    if (userRole === 'business_owner' || userRole === 'restaurant_admin') {
      const requestedBranch = (req.headers['x-branch-id'] as string) || req.query?.branchId as string;
      if (requestedBranch && mongoose.Types.ObjectId.isValid(requestedBranch)) {
        branchId = new mongoose.Types.ObjectId(requestedBranch);
      }
    }

    req.tenantScope = {
      organizationId: user.organizationId,
      branchId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to build safe MongoDB query filter with tenant scoping
 */
export const getTenantFilter = (req: TenantScopedRequest): Record<string, any> => {
  const filter: Record<string, any> = {};

  if (req.tenantScope?.organizationId) {
    filter.organizationId = req.tenantScope.organizationId;
  }

  // If specific branch is targeted
  if (req.tenantScope?.branchId) {
    filter.branchId = req.tenantScope.branchId;
  }

  return filter;
};

