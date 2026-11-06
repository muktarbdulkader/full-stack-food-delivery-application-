import mongoose, { Document, Schema } from 'mongoose';

export type TableStatus =
  | 'available'
  | 'reserved'
  | 'occupied'
  | 'waiting_for_food'
  | 'food_ready'
  | 'waiting_for_payment'
  | 'cleaning'
  | 'out_of_service';

export interface IRestaurantTable extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  tableNumber: string; // e.g. "01", "05", "VIP-1"
  name: string; // e.g. "Table 05 - Window Seat"
  diningArea: string; // e.g. "Main Dining", "Outdoor Patio", "VIP Lounge", "Bar"
  capacity: number; // e.g. 4
  status: TableStatus;
  qrCodeUrl?: string; // Data URL or Image URL
  qrToken: string; // Cryptographic lookup token
  currentSessionId?: mongoose.Types.ObjectId;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantTableSchema = new Schema<IRestaurantTable>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
      index: true,
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Table name is required'],
      trim: true,
    },
    diningArea: {
      type: String,
      default: 'Main Dining',
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1 person'],
      default: 4,
    },
    status: {
      type: String,
      enum: [
        'available',
        'reserved',
        'occupied',
        'waiting_for_food',
        'food_ready',
        'waiting_for_payment',
        'cleaning',
        'out_of_service',
      ],
      default: 'available',
      index: true,
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currentSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'TableSession',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Guarantee unique table number per branch
restaurantTableSchema.index({ branchId: 1, tableNumber: 1 }, { unique: true });

export const RestaurantTable = mongoose.model<IRestaurantTable>('RestaurantTable', restaurantTableSchema);

