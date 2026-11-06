import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  driverName?: string;
  driverPhone?: string;
  dispatcherId?: mongoose.Types.ObjectId;
  dispatcherName?: string;
  branchId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  deliveryAddress: string;
  customerName: string;
  customerPhone?: string;
  status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  assignedAt?: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  deliveryNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const deliveryAssignmentSchema = new Schema<IDeliveryAssignment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    driverName: { type: String },
    driverPhone: { type: String },
    dispatcherId: { type: Schema.Types.ObjectId, ref: 'User' },
    dispatcherName: { type: String },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    deliveryAddress: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    assignedAt: Date,
    acceptedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    failedAt: Date,
    failureReason: String,
    deliveryNotes: String,
  },
  { timestamps: true }
);

export const DeliveryAssignment = mongoose.model<IDeliveryAssignment>(
  'DeliveryAssignment',
  deliveryAssignmentSchema
);

