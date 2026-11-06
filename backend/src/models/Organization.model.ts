import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganizationSettings {
  taxRate: number; // default 0.15 for 15% VAT
  serviceChargeRate: number; // e.g. 0.05 for 5%
  currency: string; // default 'ETB'
  allowGuestOrdering: boolean;
  autoAcceptOrders: boolean;
  kdsEnabled: boolean;
}

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  logo?: string;
  businessType: 'restaurant' | 'hotel' | 'cafe' | 'cloud_kitchen' | 'chain';
  contactEmail: string;
  contactPhone: string;
  taxIdentificationNumber?: string;
  address: {
    street?: string;
    city: string;
    country: string;
  };
  settings: IOrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    businessType: {
      type: String,
      enum: ['restaurant', 'hotel', 'cafe', 'cloud_kitchen', 'chain'],
      default: 'restaurant',
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    taxIdentificationNumber: {
      type: String,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: 'Addis Ababa' },
      country: { type: String, default: 'Ethiopia' },
    },
    settings: {
      taxRate: { type: Number, default: 0.15 },
      serviceChargeRate: { type: Number, default: 0.05 },
      currency: { type: String, default: 'ETB' },
      allowGuestOrdering: { type: Boolean, default: true },
      autoAcceptOrders: { type: Boolean, default: false },
      kdsEnabled: { type: Boolean, default: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);

