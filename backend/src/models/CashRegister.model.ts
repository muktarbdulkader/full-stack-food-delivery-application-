import mongoose, { Document, Schema } from 'mongoose';

export interface ICashRegister extends Document {
  _id: mongoose.Types.ObjectId;
  cashierId: mongoose.Types.ObjectId;
  cashierName: string;
  branchId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  openingBalance: number;
  closingBalance?: number;
  expectedClosingBalance?: number;
  totalCashSales: number;
  totalDigitalSales: number;
  totalRefunds: number;
  discrepancyNote?: string;
  status: 'open' | 'closed';
  openedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cashRegisterSchema = new Schema<ICashRegister>(
  {
    cashierId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cashierName: { type: String, required: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    openingBalance: { type: Number, required: true, min: 0 },
    closingBalance: { type: Number, min: 0 },
    expectedClosingBalance: { type: Number, default: 0 },
    totalCashSales: { type: Number, default: 0 },
    totalDigitalSales: { type: Number, default: 0 },
    totalRefunds: { type: Number, default: 0 },
    discrepancyNote: { type: String },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export const CashRegister = mongoose.model<ICashRegister>('CashRegister', cashRegisterSchema);

