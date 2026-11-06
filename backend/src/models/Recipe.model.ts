import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipeIngredient {
  ingredient: mongoose.Types.ObjectId;
  quantity: number;       // amount needed per portion
  unit: string;           // unit of measurement
  wastagePercent?: number; // expected wastage %
}

export interface IRecipeVersion {
  version: number;
  ingredients: IRecipeIngredient[];
  foodCost: number;
  createdAt: Date;
  note?: string;
}

export interface IRecipe extends Document {
  _id: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  food: mongoose.Types.ObjectId;        // links to Food model
  name: string;                          // recipe name (can differ from food name)
  servingSize: number;                   // portions this recipe yields
  preparationTime: number;               // minutes
  instructions?: string;
  ingredients: IRecipeIngredient[];
  foodCost: number;                      // auto-calculated from ingredient costs
  sellingPrice: number;                  // current selling price
  grossProfit: number;                   // sellingPrice - foodCost
  profitMargin: number;                  // (grossProfit / sellingPrice) * 100
  isActive: boolean;
  versionHistory: IRecipeVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const recipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    ingredient: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    wastagePercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const recipeVersionSchema = new Schema<IRecipeVersion>(
  {
    version: { type: Number, required: true },
    ingredients: [recipeIngredientSchema],
    foodCost: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const recipeSchema = new Schema<IRecipe>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    food: { type: Schema.Types.ObjectId, ref: 'Food', required: true, index: true },
    name: { type: String, required: true, trim: true },
    servingSize: { type: Number, default: 1, min: 1 },
    preparationTime: { type: Number, default: 20 },
    instructions: { type: String },
    ingredients: { type: [recipeIngredientSchema], default: [] },
    foodCost: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    grossProfit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    versionHistory: { type: [recipeVersionSchema], default: [] },
  },
  { timestamps: true }
);

export const Recipe = mongoose.model<IRecipe>('Recipe', recipeSchema);

