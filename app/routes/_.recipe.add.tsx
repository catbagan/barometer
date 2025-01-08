import { useOutletContext, useActionData } from "@remix-run/react";
import { useState, useMemo } from "react";
import { Form } from "@remix-run/react";
import { ActionFunction, json, LinksFunction } from "@remix-run/node";
import { connectDB } from "~/db/db.server";
import { IngredientModel } from "~/db/ingredient.server";

import stylesUrl from "./../styles/_.recipe.add.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

interface Size {
  code: string;
  size: string;
  regularPrice: number;
  salePrice: number;
  savings: number;
  proof: number;
  lastUpdated: string;
}

interface RecipeIngredient {
  category: string;
  amount: string;
  brands: string[];
}

type ContextType = {
  ingredients: Array<{
    id: string;
    brand: string;
    category: string;
    lastUpdated: string;
    sizes: Size[];
  }>;
};

interface BrandCost {
  brandId: string;
  brandName: string;
  sizeUsed: string;
  pricePerOz: number;
  totalCost: number;
  unitPrice: number;
}

interface IngredientCost {
  category: string;
  amount: string;
  brandOptions: BrandCost[];
}

interface RecipeCost {
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

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const recipeIngredients = JSON.parse(
    data["ingredients"].toString()
  ) as Array<RecipeIngredient>;

  await connectDB();

  // Get all ingredients from DB with mapping
  const ingredients = (await IngredientModel.find()).map((doc) => {
    const ingredient = doc.toObject();
    return {
      _id: ingredient._id,
      brand: ingredient.brand,
      category: ingredient.category,
      lastUpdated: ingredient.lastUpdated,
      sizes: ingredient.sizes.map((s) => ({
        ...s,
        lastUpdated: s.lastUpdated.toISOString(),
      })),
    };
  });

  // Calculate costs for each ingredient
  const ingredientCosts: IngredientCost[] = recipeIngredients.map(
    (recipeIngredient) => {
      // Get full ingredient details for each brand
      const brandIngredients = ingredients.filter((ing) =>
        recipeIngredient.brands.includes(ing._id.toString())
      );

      // Calculate costs for each brand
      const brandCosts: BrandCost[] = brandIngredients.map((ingredient) => {
        // Convert amount to ounces for calculation
        const recipeAmount = parseFloat(
          recipeIngredient.amount.replace("oz", "")
        );

        // Calculate price per oz for each size and find cheapest
        const sizeOptions = ingredient.sizes.map((size) => {
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
          brandId: ingredient._id.toString(),
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
  const menuPrice = parseFloat(data.menuPrice as string);
  const recipeCosts: RecipeCost[] = brandCombinations.map((combination) => {
    const total = combination.reduce((sum, brand) => sum + brand.totalCost, 0);
    const profit = menuPrice - total;
    const profitMargin = (profit / menuPrice) * 100;

    return {
      totalCost: total,
      menuPrice,
      profit,
      profitMargin,
      breakdown: combination.map((brand) => ({
        brandName: brand.brandName,
        cost: brand.totalCost,
        sizeUsed: brand.sizeUsed,
        unitPrice: brand.unitPrice,
      })),
    };
  });

  // Sort by total cost and return
  return json({
    success: true,
    recipeCosts: recipeCosts.sort((a, b) => a.totalCost - b.totalCost),
    ingredientCosts,
    fields: {
      recipeName: data.recipeName as string,
      menuPrice: data.menuPrice as string,
      notes: data.notes as string,
      ingredients: recipeIngredients,
    },
  });
};

export default function RecipeAddRoute() {
  const { ingredients } = useOutletContext<ContextType>();
  const actionData = useActionData<{
    success: boolean;
    recipeCosts: RecipeCost[];
    ingredientCosts: IngredientCost[];
    fields: {
      recipeName: string;
      menuPrice: string;
      notes: string;
      ingredients: RecipeIngredient[];
    };
  }>();

  const [recipeName, setRecipeName] = useState(
    actionData?.fields?.recipeName || ""
  );
  const [menuPrice, setMenuPrice] = useState(
    actionData?.fields?.menuPrice || ""
  );
  const [notes, setNotes] = useState(actionData?.fields?.notes || "");
  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[]
  >(actionData?.fields?.ingredients || []);
  const [currentIngredient, setCurrentIngredient] = useState<RecipeIngredient>({
    category: "",
    amount: "1oz",
    brands: [],
  });

  const categories = useMemo(
    () => [...new Set(ingredients.map((i) => i.category.toLowerCase()))],
    [ingredients]
  );

  const standardAmounts = ["0.5oz", "1oz", "1.5oz", "2oz", "other"];

  const brandsByCategory = useMemo(() => {
    const brands: Record<string, Array<{ id: string; name: string }>> = {};
    categories.forEach((category) => {
      brands[category] = ingredients
        .filter((i) => i.category.toLowerCase() === category)
        .map((i) => ({
          id: i.id,
          name: i.brand,
        }));
    });
    return brands;
  }, [categories, ingredients]);

  const addIngredient = () => {
    if (currentIngredient.category && currentIngredient.amount) {
      setRecipeIngredients([...recipeIngredients, { ...currentIngredient }]);
      setCurrentIngredient({
        category: "",
        amount: "1oz",
        brands: [],
      });
    }
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  return (
    <Form method="post" className="recipe-form">
      <div className="basic-info">
        <div className="form-group">
          <label>
            Recipe Name:
            <input
              type="text"
              name="recipeName"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Menu Price:
            <input
              type="number"
              name="menuPrice"
              value={menuPrice}
              onChange={(e) => setMenuPrice(e.target.value)}
              step="0.01"
              required
            />
          </label>
        </div>

        {/*<div className="form-group">
          <label>
            Notes:
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>*/}
      </div>

      <div className="ingredient-section">
        <h3>Add Ingredient</h3>
        <div className="controls">
          <select
            value={currentIngredient.category}
            onChange={(e) => {
              setCurrentIngredient({
                ...currentIngredient,
                category: e.target.value,
              });
            }}
            className={`category-selector category-${
              currentIngredient.category || "default"
            } ${currentIngredient.category ? "active" : "inactive"}`}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={currentIngredient.amount}
            onChange={(e) =>
              setCurrentIngredient({
                ...currentIngredient,
                amount: e.target.value,
              })
            }
            className="amount-select"
          >
            {standardAmounts.map((amount) => (
              <option key={amount} value={amount}>
                {amount}
              </option>
            ))}
          </select>

          {currentIngredient.amount === "other" && (
            <input
              type="text"
              value={currentIngredient.amount}
              onChange={(e) =>
                setCurrentIngredient({
                  ...currentIngredient,
                  amount: e.target.value,
                })
              }
              placeholder="Enter custom amount"
              className="custom-amount"
            />
          )}

          <select
            multiple
            value={currentIngredient.brands}
            onChange={(e) =>
              setCurrentIngredient({
                ...currentIngredient,
                brands: Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                ),
              })
            }
            className="brand-select"
          >
            {currentIngredient.category &&
              brandsByCategory[currentIngredient.category]?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
          </select>

          <button type="button" onClick={addIngredient} className="add-button">
            Add Ingredient
          </button>
        </div>

        <div className="ingredient-list">
          <h3>Recipe Ingredients</h3>
          {recipeIngredients.map((ingredient, index) => (
            <div
              key={index}
              className={`ingredient-item category-selector category-${ingredient.category}`}
            >
              <span className="ingredient-details">
                {ingredient.category} - {ingredient.amount}
                {ingredient.brands.length > 0 && (
                  <span className="brand-list">
                    (
                    {ingredient.brands
                      .map(
                        (brandId) =>
                          brandsByCategory[ingredient.category]?.find(
                            (b) => b.id === brandId
                          )?.name
                      )
                      .filter(Boolean)
                      .join(", ")}
                    )
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <input
        type="hidden"
        name="ingredients"
        value={JSON.stringify(recipeIngredients)}
      />

      <button type="submit" className="calculate-button">
        Calculate Recipe Costs
      </button>

      {actionData?.success && (
        <div className="cost-analysis">
          <h3>Recipe Cost Analysis</h3>

          <div className="combinations">
            <h4>Cost Combinations (Cheapest to Most Expensive)</h4>
            {actionData.recipeCosts.map((combination, index) => (
              <div key={index} className="combination-item">
                <strong className="combination-summary">
                  Option {index + 1}: ${combination.totalCost.toFixed(2)} cost |
                  ${combination.profit.toFixed(2)} profit |
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
            {actionData.ingredientCosts.map((ingredient, index) => (
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
      )}
    </Form>
  );
}
