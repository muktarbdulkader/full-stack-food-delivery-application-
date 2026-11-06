import mongoose, { Document, Schema } from 'mongoose';

export interface IOperatingHours {
  openTime: string; // e.g. "07:00"
  closeTime: string; // e.g. "23:00"
  daysOpen: string[]; // e.g. ["Monday", "Tuesday", ...]
}

export interface IBranch extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string; // e.g. "Haramaya Branch", "Bole Branch"
  code: string; // e.g. "HRM-01", "BOL-02"
  phone: string;
  email?: string;
  address: {
    street: string;
    subcity?: string;
    city: string;
    state?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  managerId?: mongoose.Types.ObjectId;
  operatingHours: IOperatingHours;
  diningAreas: string[]; // e.g. ["Main Hall", "VIP Lounge", "Patio Garden", "Balcony"]
  isMainBranch: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      uppercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Branch phone is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      street: { type: String, required: true },
      subcity: { type: String, default: '' },
      city: { type: String, required: true, default: 'Addis Ababa' },
      state: { type: String, default: '' },
      country: { type: String, default: 'Ethiopia' },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    operatingHours: {
      openTime: { type: String, default: '07:00' },
      closeTime: { type: String, default: '23:00' },
      daysOpen: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    },
    diningAreas: {
      type: [String],
      default: ['Main Hall', 'VIP Section', 'Patio / Outdoor', 'Terrace'],
    },
    isMainBranch: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee unique branch code per organization
branchSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);

