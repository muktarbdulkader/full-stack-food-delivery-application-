import mongoose, { Document, Schema } from 'mongoose';

export type SessionStatus = 'active' | 'billing' | 'settled' | 'closed';

export interface ITableSession extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  tableNumber: string;
  guestCount: number;
  status: SessionStatus;
  openedAt: Date;
  closedAt?: Date;
  openedBy?: mongoose.Types.ObjectId; // Waiter or Self-QR
  closedBy?: mongoose.Types.ObjectId;
  orders: mongoose.Types.ObjectId[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  settlementDetails?: {
    method: string;
    transactionId?: string;
    settledAt: Date;
    settledBy?: mongoose.Types.ObjectId;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tableSessionSchema = new Schema<ITableSession>(
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
    guestCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['active', 'billing', 'settled', 'closed'],
      default: 'active',
      index: true,
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
    openedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
    },
    settlementDetails: {
      method: { type: String },
      transactionId: { type: String },
      settledAt: { type: Date },
      settledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const TableSession = mongoose.model<ITableSession>('TableSession', tableSessionSchema);

