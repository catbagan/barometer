import { ActionFunction } from "@remix-run/node";
import { MenuModel, toMenuDocument } from "~/db/menu.server";
import { Menu } from "~/types/index.type";

export const action: ActionFunction = async ({ request }) => {
  if (request.method === "POST") {
    const menu: Menu = await request.json();

    try {
      // Validate input
      if (!menu) {
        throw new Error("Invalid input: menu required ");
      }

      // Create the new menu
      const newMenu = await MenuModel.create(toMenuDocument(menu));

      return new Response(
        JSON.stringify({
          success: true,
          menu: newMenu,
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
