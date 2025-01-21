import { calculateRecipeIngredientCombinations } from "~/shared/recipe-util";
import { Ingredient, Recipe, RecipeIngredient } from "~/types/index.type";

interface RecipeToolsProps {
  recipe: Recipe;
  recipeIngredients: Array<RecipeIngredient>;
  ingredients: Array<Ingredient>;
}

export const RecipeTools = (props: RecipeToolsProps) => {
  const r = calculateRecipeIngredientCombinations(
    props.recipeIngredients,
    props.ingredients,
    props.recipe,
  );
  return (
    <div className="cost-analysis">
      <h3>Recipe Cost Analysis</h3>

      <div className="combinations">
        <h4>Cost Combinations (Cheapest to Most Expensive)</h4>
        {r.recipeCosts.map((combination, index) => (
          <div key={index} className="combination-item">
            <strong className="combination-summary">
              Option {index + 1}: ${combination.totalCost.toFixed(2)} cost | $
              {combination.profit.toFixed(2)} {'profit | '}
              {combination.profitMargin.toFixed(1)}% margin
            </strong>
            <ul className="breakdown-list">
              {combination.breakdown.map((item, i) => (
                <li key={i} className="breakdown-item">
                  {item.brandName}: ${item.cost.toFixed(2)}
                  (using {item.sizeUsed} @ ${item.unitPrice.toFixed(2)})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="ingredient-costs">
        <h4>Ingredient Details</h4>
        {r.ingredientCosts.map((ingredient, index) => (
          <div key={index} className="cost-item">
            <strong className="ingredient-name">
              {ingredient.category} ({ingredient.amount})
            </strong>
            <ul className="brand-options">
              {ingredient.brandOptions.map((brand, i) => (
                <li key={i} className="brand-option">
                  {brand.brandName}: ${brand.totalCost.toFixed(2)}
                  (${brand.pricePerOz.toFixed(2)}/oz using {brand.sizeUsed})
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
