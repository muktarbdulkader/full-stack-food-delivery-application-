import mongoose, { Document, Schema } from 'mongoose';

export type UserRole =
  | 'super_admin'
  | 'business_owner'
  | 'branch_manager'
  | 'restaurant_admin'
  | 'accountant'
  | 'inventory_manager'
  | 'cashier'
  | 'waiter'
  | 'chef'
  | 'storekeeper'
  | 'hr_manager'
  | 'delivery_manager'
  | 'driver'
  | 'user'
  | 'admin'
  | 'guest';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  assignedBranches?: mongoose.Types.ObjectId[];
  permissions?: string[];
  address?: string;
  phone?: string;
  isActive: boolean;
  registrationStatus?: 'pending' | 'active' | 'suspended' | 'rejected' | 'invited';
  employmentStatus?: 'active' | 'on_leave' | 'terminated';
  invitedBy?: mongoose.Types.ObjectId;
  invitationToken?: string;
  invitationTokenExpiry?: Date;
  emailVerified?: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: [
        'super_admin',
        'business_owner',
        'branch_manager',
        'restaurant_admin',
        'accountant',
        'inventory_manager',
        'cashier',
        'waiter',
        'chef',
        'storekeeper',
        'hr_manager',
        'delivery_manager',
        'driver',
        'user',
        'admin',
        'guest',
      ],
      default: 'user',
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
    },
    assignedBranches: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
      },
    ],
    permissions: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    registrationStatus: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected', 'invited'],
      default: 'active',
      index: true,
    },
    employmentStatus: {
      type: String,
      enum: ['active', 'on_leave', 'terminated'],
      default: 'active',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitationToken: String,
    invitationTokenExpiry: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
