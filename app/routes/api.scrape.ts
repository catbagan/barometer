import type { LoaderFunctionArgs } from "@remix-run/node";
import * as cheerio from "cheerio";
import { json } from "@remix-run/node";
import { IngredientModel } from "~/db/ingredient.server";
import { connectDB } from "~/db/db.server";

interface Ingredient {
  code: string;
  brand: string;
  size: string;
  regularPrice: number;
  salePrice: number;
  savings: number;
  proof: number;
  category?: string;
  lastUpdated: Date;
}

const scrapePage = async (url: string): Promise<Array<Ingredient>> => {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  const ingredients: Ingredient[] = [];

  // Extract category from URL
  const category = url.split("/").pop() || "";

  $("tr").each((_, row) => {
    const code = $(row).find("td:first-child").text().trim();
    // Skip headers and section titles
    if (!code || code === "Code" || code.length !== 6) return;

    const ingredient: Ingredient = {
      code,
      brand: $(row).find("td:nth-child(2)").text().trim(),
      size: $(row).find("td:nth-child(3)").text().trim(),
      regularPrice: parseFloat($(row).find("td:nth-child(4)").text().trim()),
      salePrice: parseFloat($(row).find("td:nth-child(5)").text().trim()),
      savings: parseFloat($(row).find("td:nth-child(6)").text().trim()),
      proof: parseFloat($(row).find("td:nth-child(7)").text().trim()),
      category,
      lastUpdated: new Date(),
    };

    // Only add if we have valid data
    if (
      ingredient.code &&
      ingredient.brand &&
      !isNaN(ingredient.regularPrice)
    ) {
      ingredients.push(ingredient);
    }
  });
  return ingredients;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const urlsToScrape = [
    "https://802spirits.com/price_guide/brandy",
    "https://802spirits.com/price_guide/cocktails",
    "https://802spirits.com/price_guide/cordials",
    "https://802spirits.com/price_guide/gin",
    "https://802spirits.com/price_guide/rum",
    "https://802spirits.com/price_guide/tequila",
    "https://802spirits.com/price_guide/vodka",
    "https://802spirits.com/price_guide/whiskey",
  ];
  try {
    // Connect to MongoDB
    await connectDB();
    // Scrape all ingredients
    const ingredients = (
      await Promise.all(urlsToScrape.map(scrapePage))
    ).flat();

    // Group ingredients by normalized brand name
    const brandMap: Record<
      string,
      {
        category: string;
        sizes: Array<{
          code: string;
          size: string;
          regularPrice: number;
          salePrice: number;
          savings: number;
          proof: number;
          lastUpdated: Date;
        }>;
      }
    > = {};

    ingredients.forEach((ingredient) => {
      // Normalize brand name
      let normalizedName = ingredient.brand.trim();
      if (normalizedName.endsWith(ingredient.size)) {
        normalizedName = normalizedName.replace(ingredient.size, "").trim();
      }

      // Initialize brand entry if it doesn't exist
      if (!brandMap[normalizedName]) {
        brandMap[normalizedName] = {
          category: ingredient.category || "",
          sizes: [],
        };
      }

      // Add size variant with its own price history
      brandMap[normalizedName].sizes.push({
        code: ingredient.code,
        size: ingredient.size,
        regularPrice: ingredient.regularPrice,
        salePrice: ingredient.salePrice,
        savings: ingredient.savings,
        proof: ingredient.proof,
        lastUpdated: ingredient.lastUpdated,
      });
    });

    // Prepare bulk write operations
    const operations = Object.entries(brandMap).map(([brand, data]) => ({
      updateOne: {
        filter: { brand },
        update: {
          $set: {
            brand,
            category: data.category,
            sizes: data.sizes,
            lastUpdated: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await IngredientModel.bulkWrite(operations);
    return json({
      success: true,
      message: "Ingredients updated successfully",
      stats: {
        total: ingredients.length,
        updated: result.modifiedCount,
        new: result.upsertedCount,
      },
      ingredients: ingredients.length,
    });
  } catch (error) {
    console.error("Error:", error);
    return json(
      {
        success: false,
        error: "Failed to process data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
