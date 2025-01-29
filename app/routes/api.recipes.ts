import { ActionFunction } from "@remix-run/node";
import { MenuModel, toMenuRecipeModel } from "~/db/menu.server";
import { RecipeModel, toRecipeModel } from "~/db/recipe.server";
import { Menu, Recipe } from "~/types/index.type";
import mongoose from "mongoose";

export const action: ActionFunction = async ({ request }) => {
  if (request.method === "POST") {
    const { recipe, menus, userId } = (await request.json()) as {
      recipe: Recipe;
      menus: Array<Menu>;
      userId: string;
    };

    try {
      // Validate input
      if (!recipe || !Array.isArray(menus) || !userId) {
        throw new Error("Invalid input: recipe and menus array required");
      }

      // Create the new recipe
      const newRecipe = await RecipeModel.create(toRecipeModel(recipe));

      const updatedMenuIds = [];

      // Update each menu one at a time
      for (const menu of menus) {
        const recipeInMenu = menu.recipes.find((r) => r.recipe === recipe.id);
        if (!recipeInMenu) {
          console.warn(`Recipe not found in menu ${menu.id}, skipping...`);
          continue;
        }

        // Update this specific menu
        await MenuModel.updateOne(
          { _id: new mongoose.Types.ObjectId(menu.id) },
          {
            $push: {
              recipes: toMenuRecipeModel(recipeInMenu),
            },
            $set: { updatedAt: new Date() },
          }
        );

        updatedMenuIds.push(menu.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          recipe: newRecipe,
          updatedMenus: updatedMenuIds,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error: any) {
      console.error("Error in action handler:", error);
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.stack,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
