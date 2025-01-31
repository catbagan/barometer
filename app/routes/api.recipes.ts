import { ActionFunction } from "@remix-run/node";
import { MenuModel, toMenuDocument } from "~/db/menu.server";
import { RecipeModel, toRecipeDocument } from "~/db/recipe.server";
import { Menu, Recipe } from "~/types/index.type";
import mongoose from "mongoose";
import { connectDB } from "~/db/db.server";

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

      // Validate recipe structure
      if (!recipe.name || !Array.isArray(recipe.ingredients)) {
        throw new Error("Invalid recipe structure");
      }

      // Validate recipe ingredients
      for (const ingredient of recipe.ingredients) {
        if (!ingredient.ingredientId || !ingredient.amount) {
          throw new Error("Invalid ingredient structure");
        }
        if (
          typeof ingredient.amount.quantity !== "number" ||
          !ingredient.amount.unit
        ) {
          throw new Error("Invalid ingredient amount");
        }
      }

      await connectDB();

      // Create the new recipe
      const recipeDoc = toRecipeDocument({
        ...recipe,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newRecipe = await RecipeModel.create(recipeDoc);
      const updatedMenuIds = [];

      // Update each menu
      for (const menu of menus) {
        // Skip empty or invalid menus
        if (!menu.name) continue;

        const recipeInMenu = menu.recipes.find((r) => r.recipeId === recipe.id);
        if (!recipeInMenu) {
          console.warn(`Recipe not found in menu ${menu.id}, skipping...`);
          continue;
        }

        try {
          if (menu.id) {
            // Update existing menu
            await MenuModel.updateOne(
              { _id: new mongoose.Types.ObjectId(menu.id) },
              {
                $push: {
                  recipes: {
                    recipeId: recipe.id,
                    price: recipeInMenu.price,
                  },
                },
                $set: { updatedAt: new Date() },
              }
            );
          } else {
            // Create new menu
            const menuDoc = toMenuDocument({
              ...menu,
              createdBy: userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            await MenuModel.create(menuDoc);
          }

          updatedMenuIds.push(menu.id);
        } catch (menuError) {
          console.error(`Error updating menu ${menu.id}:`, menuError);
          // Continue with other menus even if one fails
        }
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
    } catch (error: unknown) {
      console.error("Error in action handler:", error);
      if (error instanceof Error) {
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
      throw new Error("Unexpected error");
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
