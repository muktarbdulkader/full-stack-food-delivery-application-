import mongoose, { Document, Schema } from 'mongoose';

export type WaiterRequestType = 'waiter' | 'water' | 'bill' | 'assistance' | 'cleaning' | 'other';
export type WaiterRequestStatus = 'pending' | 'acknowledged' | 'resolved';

export interface IWaiterRequest extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  tableNumber: string;
  tableSessionId?: mongoose.Types.ObjectId;
  guestSessionId?: mongoose.Types.ObjectId;
  requestType: WaiterRequestType;
  status: WaiterRequestStatus;
  note?: string;
  assignedStaffId?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const waiterRequestSchema = new Schema<IWaiterRequest>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      required: true,
      index: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    tableSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'TableSession',
    },
    guestSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'GuestSession',
    },
    requestType: {
      type: String,
      enum: ['waiter', 'water', 'bill', 'assistance', 'cleaning', 'other'],
      default: 'waiter',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'resolved'],
      default: 'pending',
      index: true,
    },
    note: {
      type: String,
      default: '',
    },
    assignedStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const WaiterRequest = mongoose.model<IWaiterRequest>('WaiterRequest', waiterRequestSchema);

