import { ActionFunction, LoaderFunction } from "@remix-run/node";
import { connectDB } from "~/db/db.server";
import { RecipeModel } from "~/db/recipe.server";
import mongoose from "mongoose";
import { Ingredient, Recipe, RecipeIngredient } from "~/types/index.type";
import { useState, useEffect, useMemo } from "react";
import { Form } from "@remix-run/react";
import stylesUrl from "./../styles/recipe-view-edit.css?url";
import { LinksFunction } from "@remix-run/node";

export const action: ActionFunction = async ({ request, params }) => {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const recipeName = data.recipeName?.toString();
    const menuPrice = parseFloat(data.menuPrice?.toString() || "0");
    const notes = data.notes?.toString() || "";
    const recipeIngredients = JSON.parse(
      data.ingredients?.toString() || "[]"
    ) as Array<RecipeIngredient>;

    if (!recipeName || !recipeIngredients.length || !params.id) {
      return { success: false };
    }

    await connectDB();

    const updatedRecipe = await RecipeModel.findByIdAndUpdate(
      params.id,
      {
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
      },
      { new: true }
    );

    if (!updatedRecipe) {
      return { success: false, error: "Recipe not found" };
    }

    return { success: true, recipe: updatedRecipe };
  } catch (error) {
    console.error("Action error:", error);
    return { success: false };
  }
};

export const loader: LoaderFunction = async ({ params }) => {
  await connectDB();
  const recipe = await RecipeModel.findById(params.id);
  if (!recipe) {
    throw new Response("Recipe not found", { status: 404 });
  }
  return { recipe };
};

type ViewEditRecipeProps = {
  recipe: Recipe;
  ingredients: Ingredient[];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

const ViewEditRecipe = ({ recipe, ingredients }: ViewEditRecipeProps) => {
  const standardAmounts = ["0.5oz", "1oz", "1.5oz", "2oz", "other"];

  const categories = useMemo(
    () => [...new Set(ingredients.map((i) => i.category.toLowerCase()))],
    [ingredients]
  );

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

  const [isEditing, setIsEditing] = useState(false);
  const [recipeName, setRecipeName] = useState(recipe.name);
  const [recipeIngredients, setRecipeIngredients] = useState(
    recipe.ingredients
  );
  const [currentIngredient, setCurrentIngredient] = useState({
    category: "brandy",
    amount: "0.5oz",
    brands: brandsByCategory["brandy"].map((b) => b.name),
  });

  useEffect(() => {
    // Reset form state when switching between view/edit modes
    if (!isEditing) {
      setRecipeName(recipe.name);
      setRecipeIngredients(recipe.ingredients);
    }
  }, [isEditing, recipe]);

  const addIngredient = () => {
    if (currentIngredient.category && currentIngredient.amount) {
      setRecipeIngredients([...recipeIngredients, { ...currentIngredient }]);
      setCurrentIngredient({ category: "", amount: "", brands: [] });
    }
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  if (!isEditing) {
    return (
      <div className="recipe-view">
        <div className="recipe-header">
          <h1>{recipe.name}</h1>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="edit-button"
          >
            Edit Recipe
          </button>
        </div>

        <div className="ingredient-list">
          <h3>Ingredients</h3>
          {recipeIngredients.map((ingredient, index) => (
            <div
              key={index}
              className={`ingredient-item category-${ingredient.category}`}
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
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Form
    action="edit"
      // action={`/recipe/${recipe.id}/edit`}
      method="post"
      className="recipe-form"
    >
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

          {/*currentIngredient.amount === "other" && (
            <input
              type="text"
              value={currentIngredient.customAmount}
              onChange={(e) =>
                setCurrentIngredient({
                  ...currentIngredient,
                  customAmount: e.target.value,
                })
              }
              placeholder="Enter custom amount"
              className="custom-amount"
            />
          )*/}

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
              className={`ingredient-item category-${ingredient.category}`}
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

      <div className="form-actions">
        <button type="submit" className="save-button">
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="cancel-button"
        >
          Cancel
        </button>
      </div>
    </Form>
  );
};

export default ViewEditRecipe;
