import mongoose from "mongoose";
import { Menu, MenuRecipe } from "~/types/index.type";

export const MenuModel =
  mongoose.models.Menu ||
  mongoose.model(
    "Menu",
    new mongoose.Schema({
      name: { type: String, required: true },
      recipes: [
        {
          price: { type: Number, required: true },
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

export const fromMenuRecipeModel = (recipe: any): MenuRecipe => {
  return {
    recipe: recipe._id.toHexString(),
    price: recipe.price,
  };
};

export const fromMenuModel = (menu: any): Menu => {
  return {
    id: menu._id.toHexString(),
    name: menu.name,
    recipes: menu.recipes.map((item: any) => fromMenuRecipeModel(item)),
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
    createdBy: menu.createdBy.toHexString(),
  };
};

export const toMenuRecipeModel = (recipe: MenuRecipe): any => {
  try {
    return {
      _id: new mongoose.Types.ObjectId(recipe.recipe),
      price: recipe.price,
    };
  } catch (error: any) {
    throw new Error(
      `Failed to convert menu recipe ${recipe.recipe}: ${error.message}`
    );
  }
};

export const toMenuModel = (menu: Menu): any => {
  if (!menu || typeof menu !== "object") {
    throw new Error("Invalid menu object provided");
  }

  if (!menu.id || typeof menu.id !== "string") {
    throw new Error("Menu must have a valid id string");
  }

  if (!menu.name || typeof menu.name !== "string") {
    throw new Error("Menu must have a valid name string");
  }

  if (!Array.isArray(menu.recipes)) {
    throw new Error("Menu must have a recipes array");
  }

  // Validate recipe prices
  menu.recipes.forEach((recipe, index) => {
    if (
      typeof recipe.price !== "number" ||
      isNaN(recipe.price) ||
      recipe.price < 0
    ) {
      throw new Error(`Invalid price for recipe at index ${index}`);
    }
  });

  try {
    return {
      _id: new mongoose.Types.ObjectId(menu.id),
      name: menu.name,
      recipes: menu.recipes.map(toMenuRecipeModel),
      updatedAt: new Date(),
    };
  } catch (error: any) {
    throw new Error(`Failed to convert menu ${menu.id}: ${error.message}`);
  }
};
