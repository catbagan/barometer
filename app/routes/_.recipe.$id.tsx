import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import mongoose from "mongoose";
import { RecipeTools } from "~/components/recipe-tools";
import { connectDB } from "~/db/db.server";
import { fromIngredientModel, IngredientModel } from "~/db/ingredient.server";
import {
  fromRecipeIngredientModel,
  fromRecipeModel,
  RecipeModel,
} from "~/db/recipe.server";
import { Ingredient, Recipe, RecipeIngredient } from "~/types/index.type";

interface LoaderResponse {
  recipe: Recipe;
  recipeIngredients: Array<RecipeIngredient>;
  ingredients: Array<Ingredient>;
}

export const loader: LoaderFunction = async (
  args: LoaderFunctionArgs
): Promise<LoaderResponse | null> => {
  try {
    const { id } = args.params;
    await connectDB();
    const doc = await RecipeModel.findOne({ _id: id });
    if (doc === null) {
      return null;
    }
    const recipe = fromRecipeModel(doc);

    const docs = await IngredientModel.find({
      _id: {
        $in: recipe.ingredients.flatMap((ing) =>
          ing.brands.map((id) => new mongoose.Types.ObjectId(id))
        ),
      },
    }).lean();
    const ingredients = docs.map(fromIngredientModel)

    const recipeIngredients = recipe.ingredients.map(fromRecipeIngredientModel);

    return {
      recipe,
      recipeIngredients,
      ingredients,
    };
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
export default function RecipeRoute() {
  const { id } = useParams();
  const data = useLoaderData() as LoaderResponse;

  return (
    <>
      <h1>Recipe Details for {data.recipe.name}</h1>
      <h2>Tools</h2>
      <RecipeTools
        recipe={data.recipe}
        recipeIngredients={data.recipeIngredients}
        ingredients={data.ingredients}
      />
    </>
  );
}
