import mongoose, { Document, Schema } from 'mongoose';

export interface IStaffSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  refreshToken: string; // hashed
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const staffSessionSchema = new Schema<IStaffSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshToken: { type: String, required: true, index: true },
    deviceInfo: String,
    ipAddress: String,
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const StaffSession = mongoose.model<IStaffSession>('StaffSession', staffSessionSchema);

