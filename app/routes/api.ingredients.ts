import { ActionFunction } from "@remix-run/node";
import mongoose from "mongoose";
import { createIngredient } from "~/db/ingredient.server";
import { CustomIngredient } from "~/types/index.type";

export const action: ActionFunction = async ({ request }) => {
  if (request.method === "POST") {
    const data = await request.json();
    try {
      if (!data.name || !data.createdBy) {
        throw new Error("Invalid input: name and createdBy are required");
      }

      const ingredient: CustomIngredient = {
        id: new mongoose.Types.ObjectId().toHexString(),
        name: data.name,
        createdBy: data.createdBy,
        sources: [
          {
            name: "CUSTOM",
            sizes: [],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newIngredient = await createIngredient(ingredient);

      return new Response(
        JSON.stringify({
          success: true,
          ingredient: newIngredient,
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
      throw new Error("unexpected error");
    }
  }
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
