import { useParams, useLoaderData } from "@remix-run/react";
import { Ingredient } from "~/types/index.type";
import stylesUrl from "./../styles/_.ingredient.$id.css?url";
import {
  LinksFunction,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { connectDB } from "~/db/db.server";
import { fromIngredientModel, IngredientModel } from "~/db/ingredient.server";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export const loader: LoaderFunction = async (
  args: LoaderFunctionArgs
): Promise<Ingredient | null> => {
  try {
    const { id } = args.params;
    await connectDB();
    const doc = await IngredientModel.findOne({ _id: id });
    if (doc === null) {
      return null;
    }

    const ingredient = doc.toObject();
    return fromIngredientModel(ingredient);
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

export default function IngredientRoute() {
  const { id } = useParams();
  const data = useLoaderData() as Ingredient;

  if (!data) {
    return (
      <div className="ingredient-page">
        <div className="error-card">Ingredient not found</div>
      </div>
    );
  }

  return (
    <div className="ingredient-page">
      <div className="ingredient-card">
        <div className="header">
          <div className="header-top">
            <h1 className="brand-name">{data.brand}</h1>
            <span className="category-badge">{data.category}</span>
          </div>
          <div className="last-updated">
            Last updated: {formatDate(data.lastUpdated)}
          </div>
        </div>

        <div className="sizes-grid">
          {data.sizes.map((size) => (
            <div key={size.code} className="size-card">
              <div className="size-header">
                <h3 className="size-name">{size.size}</h3>
                <span className="size-code">{size.code}</span>
              </div>

              <div className="price-row">
                <span className="price-label">Regular Price</span>
                <span>{formatCurrency(size.regularPrice)}</span>
              </div>

              <div className="price-row">
                <span className="price-label sale-price">Sale Price</span>
                <span className="sale-price">
                  {formatCurrency(size.salePrice)}
                </span>
              </div>

              {size.savings > 0 && (
                <div className="price-row">
                  <span className="price-label savings">Savings</span>
                  <span className="savings">
                    {formatCurrency(size.savings)}
                  </span>
                </div>
              )}

              <div className="proof-section">
                <div className="price-row">
                  <span className="price-label">Proof</span>
                  <span>{size.proof}°</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
