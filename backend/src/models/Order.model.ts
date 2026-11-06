import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  food: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  selectedPortion?: string;
  selectedExtras?: { name: string; price: number }[];
  instructions?: string;
  station?: string;
  isKitchenReady?: boolean;
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

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber?: string;
  orderType: 'delivery' | 'dine_in' | 'takeaway';
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId; // Optional for QR dine-in guests
  // Dine-in fields
  tableId?: mongoose.Types.ObjectId;
  tableNumber?: string;
  tableSessionId?: mongoose.Types.ObjectId;
  guestSessionId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal?: number;
  tax?: number;
  serviceCharge?: number;
  discount?: number;
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress?: string;
  location?: ILocation;
  payment: IPayment;
  phone?: string;
  notes?: string;
  estimatedDelivery?: Date;
  preparationStartedAt?: Date;
  readyAt?: Date;
  servedAt?: Date;
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
    selectedPortion: { type: String },
    selectedExtras: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    instructions: { type: String, default: '' },
    station: { type: String, default: 'Main Kitchen' },
    isKitchenReady: { type: Boolean, default: false },
  },
  { _id: false }
);

const locationSchema = new Schema<ILocation>(
  {
    address: { type: String, default: '' },
    city: { type: String, default: 'Addis Ababa' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'Ethiopia' },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    method: {
      type: String,
      enum: ['cash', 'card', 'mpesa', 'telebirr', 'cbebirr'],
      default: 'cash',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: { type: String },
    paidAt: { type: Date },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const deliveryTrackingSchema = new Schema<IDeliveryTracking>(
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

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      index: true,
    },
    orderType: {
      type: String,
      enum: ['delivery', 'dine_in', 'takeaway'],
      default: 'delivery',
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
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      index: true,
    },
    tableNumber: {
      type: String,
      index: true,
    },
    tableSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'TableSession',
      index: true,
    },
    guestSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'GuestSession',
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'served',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
      index: true,
    },
    deliveryAddress: {
      type: String,
      default: '',
    },
    location: locationSchema,
    payment: {
      type: paymentSchema,
      default: () => ({ method: 'cash', status: 'pending' }),
    },
    phone: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    estimatedDelivery: {
      type: Date,
    },
    preparationStartedAt: {
      type: Date,
    },
    readyAt: {
      type: Date,
    },
    servedAt: {
      type: Date,
    },
    tracking: deliveryTrackingSchema,
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
