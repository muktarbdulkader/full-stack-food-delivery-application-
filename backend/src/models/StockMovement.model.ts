import mongoose, { Document, Schema } from 'mongoose';

export type MovementType =
  | 'stock_in'        // purchase/delivery received
  | 'stock_out'       // consumed by order
  | 'adjustment'      // manual correction
  | 'waste'           // spoilage/damage
  | 'transfer_in'     // from another branch
  | 'transfer_out'    // to another branch
  | 'opening_stock';  // initial stock entry

export interface IStockMovement extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  ingredient: mongoose.Types.ObjectId;
  movementType: MovementType;
  quantity: number;         // positive = in, negative = out
  unitCost?: number;        // cost per unit at time of movement
  totalCost?: number;       // quantity * unitCost
  stockBefore: number;      // stock level before this movement
  stockAfter: number;       // stock level after this movement
  referenceType?: string;   // 'Order', 'PurchaseOrder', 'Manual'
  referenceId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  purchaseOrderId?: mongoose.Types.ObjectId;
  performedBy?: mongoose.Types.ObjectId;  // staff who made adjustment
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true, index: true },
    movementType: {
      type: String,
      required: true,
      enum: ['stock_in', 'stock_out', 'adjustment', 'waste', 'transfer_in', 'transfer_out', 'opening_stock'],
      index: true,
    },
    quantity: { type: Number, required: true },
    unitCost: { type: Number },
    totalCost: { type: Number },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
  },
  { timestamps: true }
);

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);

