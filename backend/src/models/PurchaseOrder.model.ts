import mongoose, { Document, Schema } from 'mongoose';

export type POStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface IPOItem {
  ingredient: mongoose.Types.ObjectId;
  orderedQty: number;
  receivedQty?: number;
  unitCost: number;
  totalCost: number;
  unit: string;
  note?: string;
}

export interface IPurchaseOrder extends Document {
  _id: mongoose.Types.ObjectId;
  poNumber: string;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  supplier: mongoose.Types.ObjectId;
  status: POStatus;
  items: IPOItem[];
  subtotal: number;
  tax?: number;
  totalAmount: number;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  deliveryNote?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  paidAmount?: number;
  approvedBy?: mongoose.Types.ObjectId;
  receivedBy?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const poItemSchema = new Schema<IPOItem>(
  {
    ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    orderedQty: { type: Number, required: true, min: 0 },
    receivedQty: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    note: { type: String },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'],
      default: 'draft',
      index: true,
    },
    items: { type: [poItemSchema], required: true },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    expectedDelivery: { type: Date },
    actualDelivery: { type: Date },
    deliveryNote: { type: String },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    paidAmount: { type: Number, default: 0 },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);

