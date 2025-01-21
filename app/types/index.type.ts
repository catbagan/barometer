export interface Size {
  code: string;
  size: string;
  regularPrice: number;
  salePrice: number;
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
}

export interface IngredientResponse {
  ingredients: Ingredient[];
  recipes: any[];
}

export interface RecipeIngredient {
  category: string;
  amount: string;
  brands: string[];
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
  menuPrice: number;
  ingredients: Array<RecipeIngredient>;
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

export interface Menu {
  id: string;
  name: string;
}

