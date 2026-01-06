import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  food: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ILocation {
  address: string;
  city: string;
  zipCode?: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface IPayment {
  method: 'cash' | 'card' | 'mpesa' | 'telebirr' | 'cbebirr';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  paidAt?: Date;
  confirmedBy?: mongoose.Types.ObjectId;
}

export interface IDeliveryTracking {
  assignedDriver?: string;
  driverPhone?: string;
  currentLocation?: { lat: number; lng: number };
  estimatedArrival?: Date;
  deliveredAt?: Date;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  location: ILocation;
  payment: IPayment;
  phone: string;
  notes?: string;
  estimatedDelivery?: Date;
  tracking?: IDeliveryTracking;
  statusHistory?: { status: string; timestamp: Date; note?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    food: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const locationSchema = new Schema<ILocation>(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'Ethiopia' },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    method: { type: String, enum: ['cash', 'card', 'mpesa', 'telebirr', 'cbebirr'], default: 'cash' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String },
    paidAt: { type: Date },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { _id: false }
);

const trackingSchema = new Schema(
  {
    assignedDriver: { type: String },
    driverPhone: { type: String },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    estimatedArrival: { type: Date },
    deliveredAt: { type: Date },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryAddress: { type: String, required: true },
    location: locationSchema,
    payment: paymentSchema,
    phone: { type: String, required: true },
    notes: { type: String },
    estimatedDelivery: { type: Date },
    tracking: trackingSchema,
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
