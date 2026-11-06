import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  category: string;         // "Meat Supplier", "Vegetable Supplier", "Dairy", "Beverage"
  taxId?: string;
  paymentTerms?: string;    // "Net 30", "Cash on Delivery", etc.
  rating?: number;          // 1-5 star rating
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    name: { type: String, required: true, trim: true, index: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    city: { type: String },
    category: { type: String, required: true, trim: true },
    taxId: { type: String },
    paymentTerms: { type: String, default: 'Cash on Delivery' },
    rating: { type: Number, min: 1, max: 5 },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);

