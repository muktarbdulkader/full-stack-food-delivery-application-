import { Response, NextFunction } from 'express';
import { WaiterRequest } from '../models/WaiterRequest.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createError } from '../middlewares/error.middleware';

export const getWaiterRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchId, status } = req.query;
    const filter: Record<string, any> = {};

    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;
    else filter.status = { $in: ['pending', 'acknowledged'] };

    const requests = await WaiterRequest.find(filter)
      .populate('tableId', 'name diningArea')
      .populate('assignedStaffId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWaiterRequestStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const waiterRequest = await WaiterRequest.findById(id);
    if (!waiterRequest) throw createError('Waiter request not found', 404);

    waiterRequest.status = status;
    if (status === 'acknowledged') {
      waiterRequest.acknowledgedAt = new Date();
      waiterRequest.assignedStaffId = req.user?._id;
    } else if (status === 'resolved') {
      waiterRequest.resolvedAt = new Date();
    }

    await waiterRequest.save();

    res.status(200).json({
      status: 'success',
      message: `Request marked as ${status}`,
      data: { request: waiterRequest },
    });
  } catch (error) {
    next(error);
  }
};

