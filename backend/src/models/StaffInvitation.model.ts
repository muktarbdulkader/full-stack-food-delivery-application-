import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  invitedEmail: string;
  invitedName: string;
  invitedBy: mongoose.Types.ObjectId;
  role: string;
  branchId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  permissions: string[];
  token: string; // hashed token
  expiresAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const staffInvitationSchema = new Schema<IStaffInvitation>(
  {
    invitedEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    invitedName: {
      type: String,
      required: true,
      trim: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    permissions: {
      type: [String],
      default: [],
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: Date,
    revokedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

export const StaffInvitation = mongoose.model<IStaffInvitation>(
  'StaffInvitation',
  staffInvitationSchema
);

