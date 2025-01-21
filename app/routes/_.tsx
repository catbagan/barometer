import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { connectDB } from "~/db/db.server";
import { IngredientModel } from "~/db/ingredient.server";
import type { IngredientResponse } from "~/types/index.type";
import type { LinksFunction } from "@remix-run/node";
import stylesUrl from "~/styles/_.css?url";
import { Sidebar } from "~/components/sidebar";
import { useEffect, useState } from "react";
import { RecipeModel } from "~/db/recipe.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const loader: LoaderFunction = async (): Promise<IngredientResponse> => {
  try {
    await connectDB();
    const ingredients = (await IngredientModel.find()).map((doc) => {
      const ingredient = doc.toObject();
      return {
        id: ingredient._id.toHexString(),
        brand: ingredient.brand,
        category: ingredient.category,
        lastUpdated: ingredient.lastUpdated.toISOString(),
        sizes: ingredient.sizes.map((s) => ({
          ...s,
          lastUpdated: s.lastUpdated.toISOString(),
        })),
      };
    });
    const recipes = (await RecipeModel.find()).map((doc) => {
      const recipe = doc.toObject();
      return {
        id: recipe._id.toHexString(),
        name: recipe.name,
      };
    });
    return { ingredients, recipes };
  } catch (error) {
    console.error("Error:", error);
    return { ingredients: [], recipes: [] };
  }
};

export default function AppLayout() {
  const navigate = useNavigate();

  const data = useLoaderData<IngredientResponse>();
  const [selectedIngredient, setSelectedIngredient] = useState(
    data.ingredients[0]?.id
  );
  useEffect(() => {
    navigate(`/ingredient/${selectedIngredient}`);
  }, [selectedIngredient]);

  return (
    <>
      <Sidebar
        ingredients={data.ingredients}
        recipes={data.recipes}
        setSelectedIngredient={setSelectedIngredient}
        selectedIngredient={selectedIngredient}
      />
      <div id="detail">
        <Outlet context={{ ingredients: data.ingredients }} />
      </div>
    </>
  );
}
