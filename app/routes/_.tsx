import { Outlet, useLoaderData, useNavigate } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { connectDB } from "~/db/db.server";
import { IngredientModel } from "~/db/ingredient.server";
import type { IngredientResponse } from "~/types/ingredient.type";
import type { LinksFunction } from "@remix-run/node";
import stylesUrl from "~/styles/_.css?url";
import { Sidebar } from "~/components/sidebar";
import { useEffect, useState } from "react";

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
    return { ingredients };
  } catch (error) {
    console.error("Error:", error);
    return { ingredients: [] };
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
        recipes={[]}
        setSelectedIngredient={setSelectedIngredient}
        selectedIngredient={selectedIngredient}
      />
      <div id="detail">
        <Outlet context={{ ingredients: data.ingredients }} />
      </div>
    </>
  );
}
