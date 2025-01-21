import { useNavigate } from "@remix-run/react";
import type { Ingredient } from "~/types/index.type";

interface IngredientListProps {
  ingredients: Ingredient[];
  selectedIngredient: string;
  setSelectedIngredient: (id: string) => void;
}

import type { LinksFunction } from "@remix-run/node";

import stylesUrl from "./ingredient-list.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export function IngredientList({
  ingredients,
  selectedIngredient,
  setSelectedIngredient,
}: IngredientListProps) {
  const navigate = useNavigate();

  if (!ingredients || ingredients.length === 0) {
    return <p>No ingredients found</p>;
  }

  return (
    <nav>
      <ul>
        {ingredients.map((ingredient) => (
          <li
            key={ingredient.brand}
            onClick={() => {
            //  navigate(`/ingredient/${ingredient.id}`);
              setSelectedIngredient(ingredient.id);
            }}
          >
            <IngredientCard
              ingredient={ingredient}
              isSelected={ingredient.id === selectedIngredient}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface IngredientCardProps {
  ingredient: Ingredient;
  isSelected: boolean;
}

export function IngredientCard({
  ingredient,
  isSelected,
}: IngredientCardProps) {
  return (
    <div
      className={`ingredient-item ingredient-item-${ingredient.category.toLowerCase()} ${
        isSelected ? "active" : ""
      }`}
    >
      <strong>{ingredient.brand}</strong>
      {ingredient.sizes.map((sizeItem) => (
        <div
          key={sizeItem.code}
          className={`size-variant ${
            sizeItem.salePrice < sizeItem.regularPrice ? "on-sale" : ""
          }`}
        >
          <div className="price-info">
            <span className="size">{sizeItem.size}</span>
            <span className="regular-price">
              ${sizeItem.regularPrice.toFixed(2)}
            </span>
            {sizeItem.salePrice < sizeItem.regularPrice && (
              <span className="sale-price">
                ${sizeItem.salePrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
