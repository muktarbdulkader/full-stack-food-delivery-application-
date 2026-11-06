import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffRegistrationRequest extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  hashedPassword: string;
  requestedRole: string;
  requestedBranchId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const staffRegistrationRequestSchema = new Schema<IStaffRegistrationRequest>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    hashedPassword: { type: String, required: true },
    requestedRole: { type: String, required: true },
    requestedBranchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: true }
);

export const StaffRegistrationRequest = mongoose.model<IStaffRegistrationRequest>(
  'StaffRegistrationRequest',
  staffRegistrationRequestSchema
);

