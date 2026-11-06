import mongoose, { Document, Schema } from 'mongoose';

export interface IPayrollItem {
  employee: mongoose.Types.ObjectId;
  employeeCode: string;
  name: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  paymentStatus: 'pending' | 'paid';
  paidAt?: Date;
}

export interface IPayrollRun extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  month: string; // e.g. "2026-11"
  status: 'draft' | 'processed' | 'paid';
  items: IPayrollItem[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  approvedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payrollItemSchema = new Schema<IPayrollItem>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeCode: { type: String, required: true },
    name: { type: String, required: true },
    baseSalary: { type: Number, required: true },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt: { type: Date },
  },
  { _id: false }
);

const payrollRunSchema = new Schema<IPayrollRun>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    month: { type: String, required: true, index: true },
    status: { type: String, enum: ['draft', 'processed', 'paid'], default: 'draft', index: true },
    items: { type: [payrollItemSchema], required: true },
    totalGross: { type: Number, required: true },
    totalDeductions: { type: Number, default: 0 },
    totalNet: { type: Number, required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PayrollRun = mongoose.model<IPayrollRun>('PayrollRun', payrollRunSchema);

