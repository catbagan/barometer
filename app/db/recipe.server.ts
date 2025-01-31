import mongoose from "mongoose";
import {
  Recipe,
  RecipeIngredient,
  RecipeIngredientAmount,
  UnitEnum,
} from "~/types/index.type";

export interface RecipeDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  ingredients: RecipeIngredientDocument[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredientDocument {
  ingredientId: string;
  amount: RecipeIngredientAmountDocument;
}

export interface RecipeIngredientAmountDocument {
  unit: UnitEnum;
  quantity: number;
}

export interface RecipeIngredientOptionDocument {
  name: string;
  unit: UnitEnum;
  quantity: number;
  price: number;
}

const recipeIngredientAmountSchema = new mongoose.Schema({
  unit: { type: String, enum: Object.values(UnitEnum), required: true },
  quantity: { type: Number, required: true },
});

const recipeIngredientOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, enum: Object.values(UnitEnum), required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const recipeIngredientSchema = new mongoose.Schema({
  ingredientId: { type: String, required: true },
  amount: { type: recipeIngredientAmountSchema, required: true },
  options: { type: [recipeIngredientOptionSchema], required: true },
});

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ingredients: { type: [recipeIngredientSchema], required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

export const RecipeModel =
  mongoose.models.Recipe ||
  mongoose.model<RecipeDocument>("Recipe", recipeSchema);

const toRecipeIngredientAmountDocument = (
  amount: RecipeIngredientAmount
): RecipeIngredientAmountDocument => ({
  unit: amount.unit,
  quantity: amount.quantity,
});

const toRecipeIngredientDocument = (
  ingredient: RecipeIngredient
): RecipeIngredientDocument => ({
  ingredientId: ingredient.ingredientId,
  amount: toRecipeIngredientAmountDocument(ingredient.amount),
});

export const toRecipeDocument = (recipe: Recipe): Partial<RecipeDocument> => ({
  name: recipe.name,
  ingredients: recipe.ingredients.map(toRecipeIngredientDocument),
  createdBy: new mongoose.Types.ObjectId(recipe.createdBy),
  createdAt: new Date(recipe.createdAt),
  updatedAt: new Date(recipe.updatedAt),
});

const fromRecipeIngredientAmountDocument = (
  doc: RecipeIngredientAmountDocument
): RecipeIngredientAmount => ({
  unit: doc.unit,
  quantity: doc.quantity,
});

const fromRecipeIngredientDocument = (
  doc: RecipeIngredientDocument
): RecipeIngredient => ({
  ingredientId: doc.ingredientId,
  amount: fromRecipeIngredientAmountDocument(doc.amount),
});

export const fromRecipeDocument = (doc: RecipeDocument): Recipe => ({
  id: doc._id.toHexString(),
  name: doc.name,
  ingredients: doc.ingredients.map(fromRecipeIngredientDocument),
  createdBy: doc.createdBy.toHexString(),
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

// DB operations
export const getRecipesForUser = async (userId: string): Promise<Recipe[]> => {
  const recipes = await RecipeModel.find({
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  return recipes.map((doc) => fromRecipeDocument(doc.toObject()));
};

export const createRecipe = async (recipe: Recipe): Promise<Recipe> => {
  const doc = await RecipeModel.create(toRecipeDocument(recipe));
  return fromRecipeDocument(doc.toObject());
};

export const updateRecipe = async (
  id: string,
  recipe: Recipe
): Promise<Recipe> => {
  const doc = await RecipeModel.findByIdAndUpdate(
    id,
    toRecipeDocument(recipe),
    { new: true }
  );

  if (!doc) {
    throw new Error(`Recipe with id ${id} not found`);
  }

  return fromRecipeDocument(doc.toObject());
};
