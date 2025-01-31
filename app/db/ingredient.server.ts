import mongoose from "mongoose";
import {
  Ingredient,
  CustomIngredient,
  ProductSource,
  ProductSize,
  UnitEnum,
} from "~/types/index.type";

export interface IngredientDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  sources: ProductSourceDocument[];
  proof?: number;
  alcoholType?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductSourceDocument {
  name: string;
  sizes: ProductSizeDocument[];
}

export interface ProductSizeDocument {
  unit: UnitEnum;
  quantity: number;
  price: number;
  discount: number;
  unitPrice: number;
}

const productSizeSchema = new mongoose.Schema({
  unit: { type: String, enum: Object.values(UnitEnum), required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
});

const productSourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sizes: { type: [productSizeSchema], required: true },
});

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sources: { type: [productSourceSchema], required: true },
  proof: { type: Number, required: false },
  alcoholType: { type: String, required: false },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  createdAt: { type: Date, required: false, default: Date.now },
  updatedAt: { type: Date, required: false, default: Date.now },
});

export const IngredientModel =
  mongoose.models.Ingredient ||
  mongoose.model<IngredientDocument>("Ingredient", ingredientSchema);

const toProductSizeDocument = (size: ProductSize): ProductSizeDocument => ({
  unit: size.unit,
  quantity: size.quantity,
  price: size.price,
  discount: size.discount,
  unitPrice: size.unitPrice,
});

const toProductSourceDocument = (
  source: ProductSource
): ProductSourceDocument => ({
  name: source.name,
  sizes: source.sizes.map(toProductSizeDocument),
});

export const toIngredientDocument = (
  ingredient: Ingredient | CustomIngredient
): Partial<IngredientDocument> => {
  const base = {
    name: ingredient.name,
    sources: ingredient.sources.map(toProductSourceDocument),
    proof: ingredient.proof,
    alcoholType: ingredient.alcoholType,
  };

  if ("createdBy" in ingredient) {
    return {
      ...base,
      createdBy: new mongoose.Types.ObjectId(ingredient.createdBy),
      createdAt: new Date(ingredient.createdAt),
      updatedAt: new Date(ingredient.updatedAt),
    };
  }

  return base;
};

const fromProductSizeDocument = (doc: ProductSizeDocument): ProductSize => ({
  unit: doc.unit,
  quantity: doc.quantity,
  price: doc.price,
  discount: doc.discount,
  unitPrice: doc.unitPrice,
});

const fromProductSourceDocument = (
  doc: ProductSourceDocument
): ProductSource => ({
  name: doc.name,
  sizes: doc.sizes.map(fromProductSizeDocument),
});

export const fromIngredientDocument = (
  doc: IngredientDocument
): Ingredient | CustomIngredient => {
  const base = {
    id: doc._id.toHexString(),
    name: doc.name,
    sources: doc.sources.map(fromProductSourceDocument),
    proof: doc.proof,
    alcoholType: doc.alcoholType,
  };

  if (doc.createdBy) {
    return {
      ...base,
      createdBy: doc.createdBy.toHexString(),
      createdAt: doc.createdAt!.toISOString(),
      updatedAt: doc.updatedAt!.toISOString(),
    };
  }

  return base;
};

// DB operations remain the same
export const getIngredientsForUser = async (
  userId: string
): Promise<(Ingredient | CustomIngredient)[]> => {
  const ingredients = await IngredientModel.find({
    $or: [
      { createdBy: { $exists: false } },
      { createdBy: new mongoose.Types.ObjectId(userId) },
    ],
  });

  return ingredients.map((doc) => fromIngredientDocument(doc.toObject()));
};

export const createIngredient = async (
  ingredient: Ingredient | CustomIngredient
): Promise<Ingredient | CustomIngredient> => {
  const doc = await IngredientModel.create(toIngredientDocument(ingredient));
  return fromIngredientDocument(doc.toObject());
};

export const updateIngredient = async (
  id: string,
  ingredient: Ingredient | CustomIngredient
): Promise<Ingredient | CustomIngredient> => {
  const doc = await IngredientModel.findByIdAndUpdate(
    id,
    toIngredientDocument(ingredient),
    { new: true }
  );

  if (!doc) {
    throw new Error(`Ingredient with id ${id} not found`);
  }

  return fromIngredientDocument(doc.toObject());
};
