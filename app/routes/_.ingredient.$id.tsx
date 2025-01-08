import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Params, useLoaderData, useParams } from "@remix-run/react";
import { connectDB } from "~/db/db.server";
import { IngredientModel } from "~/db/ingredient.server";

export const loader: LoaderFunction = async (
  args: LoaderFunctionArgs
): Promise<string> => {
  try {
    const { id } = args.params;
    await connectDB();
    const doc = await IngredientModel.findOne({ _id: id });
    if (doc === null) {
      return "not found";
    }

    const ingredient = doc.toObject();
    const parsed = {
      id: ingredient._id.toHexString(),
      brand: ingredient.brand,
      category: ingredient.category,
      lastUpdated: ingredient.lastUpdated.toISOString(),
      sizes: ingredient.sizes.map((s) => ({
        ...s,
        lastUpdated: s.lastUpdated.toISOString(),
      })),
    };

    return JSON.stringify(parsed);
  } catch (error) {
    console.error("Error:", error);
    return "error";
  }
};

export default function IngredientRoute() {
  const { id } = useParams();
  const data = useLoaderData() as string;

  return (
    <>
      <div>Ingredient Details for {id}</div>
      <p>{data}</p>
    </>
  );
}
