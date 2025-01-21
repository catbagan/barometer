import { useOutletContext, useActionData } from "@remix-run/react";
import { useState, useMemo, ContextType } from "react";
import { Form } from "@remix-run/react";
import { ActionFunction, json, LinksFunction } from "@remix-run/node";
import { connectDB } from "~/db/db.server";

import stylesUrl from "./../styles/_.recipe.add.css?url";
import mongoose from "mongoose";
import { RecipeModel } from "~/db/recipe.server";
import { IngredientModel } from "~/db/ingredient.server";
import {
  BrandCost,
  Ingredient,
  IngredientCost,
  RecipeCost,
  RecipeIngredient,
} from "~/types/index.type";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    // Parse and validate form data
    const recipeName = data.recipeName?.toString();
    const menuPrice = parseFloat(data.menuPrice?.toString() || "0");
    const notes = data.notes?.toString() || "";
    const recipeIngredients = JSON.parse(
      data.ingredients?.toString() || "[]"
    ) as Array<RecipeIngredient>;

    // Validation
    if (!recipeName || !menuPrice || !recipeIngredients.length) {
      return json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Save recipe to database
    const recipe = new RecipeModel({
      name: recipeName,
      menuPrice,
      notes,
      ingredients: recipeIngredients.map((ing) => ({
        category: ing.category,
        amount: ing.amount,
        brands: ing.brands.map(
          (brandId) => new mongoose.Types.ObjectId(brandId)
        ),
      })),
    });

    await recipe.save();

    return { success: true };
  } catch (error) {
    console.error("Action error:", error);
    return json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
};

export default function RecipeAddRoute() {
  const { ingredients } = useOutletContext<{
    ingredients: Array<Ingredient>;
  }>();
  const actionData = useActionData<{
    success: boolean;
  }>();

  const [recipeName, setRecipeName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState<
    Array<RecipeIngredient>
  >([]);
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

      <button type="submit" className="save-button">
        Save Recipe
      </button>
    </Form>
  );
}
