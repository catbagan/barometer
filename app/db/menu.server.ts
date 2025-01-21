import mongoose from "mongoose";
import { Menu } from "~/types/index.type";

export const MenuModel =
  mongoose.models.Menu ||
  mongoose.model(
    "Menu",
    new mongoose.Schema({
      name: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    })
  );

export const fromMenuModel = (recipe: any): Menu => {
  return {
    id: recipe._id.toHexString(),
    name: recipe.name,
  };
};
