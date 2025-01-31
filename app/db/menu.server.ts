import mongoose from "mongoose";
import { Menu, MenuRecipe } from "~/types/index.type";

export interface MenuDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  recipes: MenuRecipeDocument[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuRecipeDocument {
  recipeId: string;
  price: number;
}

const menuRecipeSchema = new mongoose.Schema({
  recipeId: { type: String, required: true },
  price: { type: Number, required: true },
});

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  recipes: { type: [menuRecipeSchema], required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

export const MenuModel =
  mongoose.models.Menu || mongoose.model<MenuDocument>("Menu", menuSchema);

const toMenuRecipeDocument = (recipe: MenuRecipe): MenuRecipeDocument => ({
  recipeId: recipe.recipeId,
  price: recipe.price,
});

export const toMenuDocument = (menu: Menu): Partial<MenuDocument> => ({
  name: menu.name,
  recipes: menu.recipes.map(toMenuRecipeDocument),
  createdBy: new mongoose.Types.ObjectId(menu.createdBy),
  createdAt: new Date(menu.createdAt),
  updatedAt: new Date(menu.updatedAt),
});

const fromMenuRecipeDocument = (doc: MenuRecipeDocument): MenuRecipe => ({
  recipeId: doc.recipeId,
  price: doc.price,
});

export const fromMenuDocument = (doc: MenuDocument): Menu => ({
  id: doc._id.toHexString(),
  name: doc.name,
  recipes: doc.recipes.map(fromMenuRecipeDocument),
  createdBy: doc.createdBy.toHexString(),
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

// DB operations
export const getMenusForUser = async (userId: string): Promise<Menu[]> => {
  const menus = await MenuModel.find({
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  return menus.map((doc) => fromMenuDocument(doc.toObject()));
};

export const createMenu = async (menu: Menu): Promise<Menu> => {
  const doc = await MenuModel.create(toMenuDocument(menu));
  return fromMenuDocument(doc.toObject());
};

export const updateMenu = async (id: string, menu: Menu): Promise<Menu> => {
  const doc = await MenuModel.findByIdAndUpdate(id, toMenuDocument(menu), {
    new: true,
  });

  if (!doc) {
    throw new Error(`Menu with id ${id} not found`);
  }

  return fromMenuDocument(doc.toObject());
};
