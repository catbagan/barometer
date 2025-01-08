interface RecipeListProps {
  recipes: any[];
}

import type { LinksFunction } from "@remix-run/node";

import stylesUrl from "./recipe-list.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesUrl },
];

export function RecipeList({ recipes }: RecipeListProps) {
  return <p>No recipes found</p>;
}
