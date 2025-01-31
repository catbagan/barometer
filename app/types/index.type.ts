export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Session {
  userId: string;
}

interface Timestamp {
  createdAt: string;
  updatedAt: string;
}

interface UserOwned {
  createdBy: string;
}

export interface ProductSource {
  name: string;
  sizes: ProductSize[];
}

export enum UnitEnum {
  ml = "ml",
  oz = "oz",
  each = "ea",
}

export interface ProductSize {
  unit: UnitEnum;
  quantity: number;
  price: number;
  discount: number;
  unitPrice: number;
}

export interface Ingredient {
  id: string;
  name: string;
  sources: ProductSource[];

  // TODO - maybe group separately
  proof?: number; // e.g. 80
  alcoholType?: string; // e.g. vodka, gin
}

export interface CustomIngredient extends Ingredient, UserOwned, Timestamp {}

export interface RecipeIngredientAmount {
  unit: UnitEnum;
  quantity: number;
}
export interface RecipeIngredient {
  ingredientId: string;
  amount: RecipeIngredientAmount;
}

export interface Recipe extends Timestamp, UserOwned {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface MenuRecipe {
  recipeId: string;
  price: number;
}

export interface Menu extends Timestamp, UserOwned {
  id: string;
  name: string;
  recipes: MenuRecipe[];
}

export interface BrandCost {
  brandId: string;
  brandName: string;
  sizeUsed: string;
  pricePerOz: number;
  totalCost: number;
  unitPrice: number;
}

export interface IngredientCost {
  category: string;
  amount: string;
  brandOptions: BrandCost[];
}

export interface RecipeCost {
  totalCost: number;
  menuPrice: number;
  profit: number;
  profitMargin: number;
  breakdown: Array<{
    brandName: string;
    cost: number;
    sizeUsed: string;
    unitPrice: number;
  }>;
}
