/*import {
  BrandCost,
  Ingredient,
  IngredientCost,
  RecipeCost,
  RecipeIngredient,
  Size,
} from "~/types/index.type";

interface Combinations {
  recipeCosts: Array<RecipeCost>;
  ingredientCosts: Array<IngredientCost>;
}

export const calculateRecipeIngredientCombinations = (
  recipeIngredients: Array<RecipeIngredient>,
  ingredients: Array<Ingredient>,
): Combinations => {
  // Calculate costs for each ingredient
  const ingredientCosts: IngredientCost[] = recipeIngredients.map(
    (recipeIngredient) => {
      // Get full ingredient details for each brand
      const brandIngredients = ingredients.filter((ing) =>
        recipeIngredient.brands.map((b) => b.id).includes(ing.id)
      );

      // Calculate costs for each brand
      const brandCosts: BrandCost[] = brandIngredients.map((ingredient) => {
        // Convert amount to ounces for calculation
        const recipeAmount = parseFloat(
          recipeIngredient.amount.replace("oz", "")
        );

        // Calculate price per oz for each size and find cheapest
        const sizeOptions = ingredient.sizes.map((size: Size) => {
          // Extract numeric value from size (e.g., "750ml" -> 750)
          const sizeValue = parseFloat(size.size.match(/\d+/)![0]);

          // Convert to ounces if necessary (assuming sizes are in ml)
          const sizeInOz = sizeValue / 29.5735; // ml to oz conversion

          // Calculate price per oz
          const pricePerOz = size.salePrice / sizeInOz;

          return {
            ...size,
            pricePerOz,
            totalSize: sizeInOz,
          };
        });

        // Find size option with lowest price per oz
        const cheapestSize = sizeOptions.reduce((prev, curr) =>
          prev.pricePerOz < curr.pricePerOz ? prev : curr
        );

        // Calculate total cost for this brand using recipe amount
        const totalCost = cheapestSize.pricePerOz * recipeAmount;

        return {
          brandId: ingredient.id,
          brandName: ingredient.brand,
          sizeUsed: cheapestSize.size,
          pricePerOz: cheapestSize.pricePerOz,
          totalCost: totalCost,
          unitPrice: cheapestSize.salePrice,
        };
      });

      return {
        category: recipeIngredient.category,
        amount: recipeIngredient.amount,
        brandOptions: brandCosts,
      };
    }
  );

  // Generate all possible brand combinations
  const brandCombinations = ingredientCosts
    .map((ingredient) => ingredient.brandOptions)
    .reduce<BrandCost[][]>((acc, curr) => {
      if (acc.length === 0) return curr.map((item) => [item]);
      return acc.flatMap((a) => curr.map((b) => [...a, b]));
    }, []);

  // Calculate total cost for each combination
  const recipeCosts: RecipeCost[] = brandCombinations.map((combination) => {
    const total = combination.reduce((sum, brand) => sum + brand.totalCost, 0);

    return {
      totalCost: total,
      menuPrice: 0,
      profit: 0,
      profitMargin: 0,
      breakdown: combination.map((brand) => ({
        brandName: brand.brandName,
        cost: brand.totalCost,
        sizeUsed: brand.sizeUsed,
        unitPrice: brand.unitPrice,
      })),
    };
  });

  // Sort by total cost and return
  return {
    recipeCosts: recipeCosts.sort((a, b) => a.totalCost - b.totalCost),
    ingredientCosts,
  };
};
*/