import mongoose, { Document, Schema } from 'mongoose';

export type AccountCategory = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  code: string; // e.g. "1010" Cash, "4010" Food Sales, "5010" Ingredient Purchases
  name: string;
  category: AccountCategory;
  balance: number;
  currency: string;
  isSystemAccount: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    code: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
      index: true,
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'ETB' },
    isSystemAccount: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Account = mongoose.model<IAccount>('Account', accountSchema);
