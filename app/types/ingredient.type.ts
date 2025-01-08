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
}
