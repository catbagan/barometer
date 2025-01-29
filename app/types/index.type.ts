export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Size {
  code: string;
  size: string;
  sizeInMl: number;
  sizeInOz: number;
  regularPrice: number;
  salePrice: number;
  pricePerOz: number;
  savings: number;
  proof: number;
  lastUpdated: string;
}

export interface Ingredient {
  id: string;
  brand: string;
  category: string;
  lastUpdated: string;
  sizes: Size[];
  createdBy: string; // User ID
}

export interface IngredientResponse {
  ingredients: Ingredient[];
}

export interface IngredientBrand {
  id: string;
  name: string;
}

export interface RecipeIngredient {
  id: string;
  category: string;
  amount: string;
  brands: IngredientBrand[];
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

export interface Recipe {
  id: string;
  name: string;
  ingredients: Array<RecipeIngredient>;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeCost {
  totalCost: number;
  menuPrice: number;
  profit: number;
  profitMargin: number; // as percentage
  breakdown: Array<{
    brandName: string;
    cost: number;
    sizeUsed: string;
    unitPrice: number;
  }>;
}

export interface MenuRecipe {
  recipe: string; // Recipe ID
  price: number;
}

export interface Menu {
  id: string;
  name: string;
  recipes: Array<MenuRecipe>;
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}
