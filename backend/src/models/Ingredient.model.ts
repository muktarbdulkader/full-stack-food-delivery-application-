import mongoose, { Document, Schema } from 'mongoose';

export type UnitType =
  | 'kg' | 'g' | 'lb' | 'oz'       // weight
  | 'L' | 'ml' | 'cup' | 'tbsp' | 'tsp' // volume
  | 'piece' | 'dozen' | 'pack' | 'bag' | 'bottle' | 'can'; // count

export interface IIngredient extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  name: string;
  category: string;         // e.g. "Protein", "Vegetable", "Spice", "Grain", "Dairy"
  unit: UnitType;
  currentStock: number;
  minimumStock: number;     // triggers low-stock alert
  maximumStock?: number;
  unitCost: number;         // cost per unit in ETB
  supplierId?: mongoose.Types.ObjectId;
  expiryDate?: Date;
  batchNumber?: string;
  storageLocation?: string; // "Dry Store", "Fridge", "Freezer"
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredient>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'lb', 'oz', 'L', 'ml', 'cup', 'tbsp', 'tsp', 'piece', 'dozen', 'pack', 'bag', 'bottle', 'can'],
    },
    currentStock: { type: Number, required: true, default: 0, min: 0 },
    minimumStock: { type: Number, required: true, default: 0, min: 0 },
    maximumStock: { type: Number },
    unitCost: { type: Number, required: true, default: 0, min: 0 },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    expiryDate: { type: Date },
    batchNumber: { type: String },
    storageLocation: {
      type: String,
      enum: ['Dry Store', 'Fridge', 'Freezer', 'Bar', 'Other'],
      default: 'Dry Store',
    },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Virtual: is low stock?
ingredientSchema.virtual('isLowStock').get(function (this: IIngredient) {
  return this.currentStock <= this.minimumStock;
});

ingredientSchema.set('toJSON', { virtuals: true });

export const Ingredient = mongoose.model<IIngredient>('Ingredient', ingredientSchema);

