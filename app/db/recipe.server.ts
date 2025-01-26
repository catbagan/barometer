import mongoose, { mongo } from "mongoose";
import { Recipe, RecipeIngredient } from "~/types/index.type";

export const RecipeModel =
  mongoose.models.Recipe ||
  mongoose.model(
    "Recipe",
    new mongoose.Schema({
      name: { type: String, required: true },
      menuId: { type: mongoose.Types.ObjectId, required: true },
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
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    })
  );

export const fromRecipeIngredientModel = (
  ingredient: any
): RecipeIngredient => {
  return {
    category: ingredient.category,
    amount: ingredient.amount,
    brands: ingredient.brands,
  };
};

export const fromRecipeModel = (recipe: any): Recipe => {
  return {
    id: recipe._id.toHexString(),
    name: recipe.name,
    menuPrice: recipe.menuPrice,
    ingredients: recipe.ingredients.map(fromRecipeIngredientModel),
  };
};
