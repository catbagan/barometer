import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import rootStylesUrl from "~/styles/root.css?url";

import { links as tabsLinks } from "~/components/tabs";
import { links as sidebarLinks } from "~/components/sidebar";
import { links as categoryFiltersLinks } from "~/components/category-filters";
import { links as ingredientListLinks } from "~/components/ingredient-list";
import { links as recipeListLinks } from "~/components/recipe-list";
import { links as recipeAddLinks } from "~/routes/_.recipe.add";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: rootStylesUrl },
  ...sidebarLinks(),
  ...tabsLinks(),
  ...categoryFiltersLinks(),
  ...ingredientListLinks(),
  ...recipeListLinks(),
  ...recipeAddLinks(),
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
