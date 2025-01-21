interface RecipeListProps {
  recipes: Recipe[];
  setSelectedRecipeId: (id: string) => void;
  selectedRecipeId: string;
}

import type { LinksFunction } from "@remix-run/node";

import stylesUrl from "./recipe-list.css?url";
import { useNavigate } from "@remix-run/react";
import { useState } from "react";
import { Recipe } from "~/types/index.type";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export function RecipeList({
  recipes,
  setSelectedRecipeId,
  selectedRecipeId,
}: RecipeListProps) {
  const navigate = useNavigate();

  if (recipes.length === 0) {
    return <p>No recipes found</p>;
  }

  return (
    <nav>
      <ul>
        {recipes.map((recipe, idx) => (
          <li
            key={recipe.id}
            onClick={() => {
              setSelectedRecipeId(recipe.id);
              navigate(`/recipe/${recipe.id}`);
            }}
          >
            <RecipeCard
              recipe={recipe}
              isSelected={recipe.id === selectedRecipeId}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface RecipeCardProps {
  recipe: any;
  isSelected: boolean;
}

export function RecipeCard({ recipe, isSelected }: RecipeCardProps) {
  return (
    <div
      className={`recipe-item recipe-item-${recipe.name.toLowerCase()} ${
        isSelected ? "active" : ""
      }`}
    >
      <strong>{recipe.name}</strong>
    </div>
  );
}
