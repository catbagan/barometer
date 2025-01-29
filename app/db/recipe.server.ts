import mongoose, { mongo } from "mongoose";
import { Recipe, RecipeIngredient } from "~/types/index.type";

export const RecipeModel =
  mongoose.models.Recipe ||
  mongoose.model(
    "Recipe",
    new mongoose.Schema({
      name: { type: String, required: true },
      ingredients: [
        {
          category: { type: String, required: true },
          amount: { type: String, required: true }, // e.g., "1oz"
          brands: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Ingredient",
            },
          ],
        },
      ],
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    })
  );

export const fromRecipeIngredientModel = (
  ingredient: any
): RecipeIngredient => {
  return {
    id: ingredient._id.toHexString(),
    category: ingredient.category,
    amount: ingredient.amount,
    brands: ingredient.brands,
  };
};

export const fromRecipeModel = (recipe: any): Recipe => {
  return {
    id: recipe._id.toHexString(),
    name: recipe.name,
    ingredients: recipe.ingredients.map(fromRecipeIngredientModel),
    createdBy: recipe.createdBy.toHexString(),
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
};

const toRecipeIngredientModel = (ingredient: RecipeIngredient): any => {
  try {
    return {
      _id: new mongoose.Types.ObjectId(ingredient.id),
      category: ingredient.category,
      amount: ingredient.amount,
      brands: ingredient.brands.map(
        (brand) => new mongoose.Types.ObjectId(brand.id)
      ),
    };
  } catch (error: any) {
    throw new Error(
      `Failed to convert ingredient ${ingredient.id}: ${error.message}`
    );
  }
};

export const toRecipeModel = (recipe: Recipe): any => {
  if (!recipe || typeof recipe !== "object") {
    throw new Error("Invalid recipe object provided");
  }

  if (!recipe.id || typeof recipe.id !== "string") {
    throw new Error("Recipe must have a valid id string");
  }

  if (!recipe.name || typeof recipe.name !== "string") {
    throw new Error("Recipe must have a valid name string");
  }

  if (!Array.isArray(recipe.ingredients)) {
    throw new Error("Recipe must have an ingredients array");
  }

  try {
    return {
      _id: new mongoose.Types.ObjectId(recipe.id),
      name: recipe.name,
      ingredients: recipe.ingredients.map(toRecipeIngredientModel),
      createdBy: new mongoose.Types.ObjectId(recipe.createdBy),
      createdAt: recipe.createdAt ?? new Date(),
      updatedAt: recipe.updatedAt ?? new Date(),
    };
  } catch (error: any) {
    throw new Error(`Failed to convert recipe ${recipe.id}: ${error.message}`);
  }
};
