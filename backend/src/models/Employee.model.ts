import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  employeeCode: string; // e.g. "EMP-001"
  user?: mongoose.Types.ObjectId; // links to User account if they can log in
  name: string;
  phone: string;
  email?: string;
  role: 'branch_manager' | 'cashier' | 'waiter' | 'chef' | 'kitchen_staff' | 'delivery_driver' | 'cleaner' | 'accountant';
  employmentType: 'full_time' | 'part_time' | 'contract';
  salaryType: 'monthly' | 'hourly';
  baseSalary: number; // in ETB
  hourlyRate?: number;
  hireDate: Date;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    employeeCode: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: {
      type: String,
      required: true,
      enum: ['branch_manager', 'cashier', 'waiter', 'chef', 'kitchen_staff', 'delivery_driver', 'cleaner', 'accountant'],
      index: true,
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract'],
      default: 'full_time',
    },
    salaryType: {
      type: String,
      enum: ['monthly', 'hourly'],
      default: 'monthly',
    },
    baseSalary: { type: Number, required: true, min: 0 },
    hourlyRate: { type: Number, default: 0 },
    hireDate: { type: Date, default: Date.now },
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolderName: { type: String },
    },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);

