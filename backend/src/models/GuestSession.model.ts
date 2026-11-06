import mongoose, { Document, Schema } from 'mongoose';

export interface IGuestCartItem {
  foodId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedExtras?: { name: string; price: number }[];
  specialInstructions?: string;
  itemTotal: number;
}

export interface IGuestSession extends Document {
  _id: mongoose.Types.ObjectId;
  guestToken: string;
  tableSessionId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  guestName: string;
  cart: IGuestCartItem[];
  placedOrders: mongoose.Types.ObjectId[];
  lastActiveAt: Date;
  createdAt: Date;
}

const guestCartItemSchema = new Schema<IGuestCartItem>(
  {
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedSize: { type: String },
    selectedExtras: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    specialInstructions: { type: String, default: '' },
    itemTotal: { type: Number, required: true },
  },
  { _id: false }
);

const guestSessionSchema = new Schema<IGuestSession>(
  {
    guestToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tableSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'TableSession',
      required: true,
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    guestName: {
      type: String,
      default: 'Guest Diner',
    },
    cart: {
      type: [guestCartItemSchema],
      default: [],
    },
    placedOrders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const GuestSession = mongoose.model<IGuestSession>('GuestSession', guestSessionSchema);

