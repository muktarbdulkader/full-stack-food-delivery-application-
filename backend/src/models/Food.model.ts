import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodPortion {
  name: string; // "Small", "Regular", "Large", "Full Injera"
  price: number;
  isDefault?: boolean;
}

export interface IFoodExtra {
  name: string; // "Extra Cheese", "Extra Tibs Meat", "Awaze", "Ayib"
  price: number;
}

export interface IFood extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  model3dGlb?: string; // 3D model for AR view (.glb)
  model3dUsdz?: string; // 3D model for Apple QuickLook AR (.usdz)
  portions?: IFoodPortion[];
  extras?: IFoodExtra[];
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy' | 'Very Hot';
  isFasting?: boolean; // Ethiopian fasting / ጾም
  isAvailable: boolean;
  preparationTimeMinutes: number;
  kitchenStation: string; // e.g. "Grill", "Stew", "Oven", "Beverage"
  createdAt: Date;
  updatedAt: Date;
}

const foodPortionSchema = new Schema<IFoodPortion>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const foodExtraSchema = new Schema<IFoodExtra>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const foodSchema = new Schema<IFood>(
  {
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
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700',
    },
    model3dGlb: {
      type: String,
      default: 'https://modelviewer.dev/shared-assets/models/glTF-Sample-Assets/Models/Burger/glTF-Binary/Burger.glb',
    },
    model3dUsdz: {
      type: String,
    },
    portions: {
      type: [foodPortionSchema],
      default: [],
    },
    extras: {
      type: [foodExtraSchema],
      default: [],
    },
    spiceLevel: {
      type: String,
      enum: ['Mild', 'Medium', 'Spicy', 'Very Hot'],
      default: 'Medium',
    },
    isFasting: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTimeMinutes: {
      type: Number,
      default: 20,
    },
    kitchenStation: {
      type: String,
      default: 'Main Kitchen',
    },
  },
  {
    timestamps: true,
  }
);

export const Food = mongoose.model<IFood>('Food', foodSchema);
