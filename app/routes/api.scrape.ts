import type { LoaderFunctionArgs } from "@remix-run/node";
import * as cheerio from "cheerio";
import { json } from "@remix-run/node";
import { IngredientModel } from "~/db/ingredient.server";
import { connectDB } from "~/db/db.server";
import type { Ingredient, Size } from "~/types/index.type";
import mongoose, { mongo } from "mongoose";

interface ScrapedIngredient {
  code: string;
  brand: string;
  size: string;
  sizeInMl: number;
  sizeInOz: number;
  regularPrice: number;
  salePrice: number;
  pricePerOz: number;
  savings: number;
  proof: number;
  category: string;
  lastUpdated: string;
}

const parseSizeToMl = (sizeStr: string): number => {
  if (!sizeStr) return 0;

  const normalized = sizeStr.toString().toLowerCase().trim();
  if (!normalized) return 0;

  const standaloneUnits: { [key: string]: number } = {
    liter: 1000,
    liters: 1000,
    l: 1000,
    ml: 1,
    oz: 29.5735,
    ounce: 29.5735,
    ounces: 29.5735,
  };

  if (standaloneUnits.hasOwnProperty(normalized)) {
    return standaloneUnits[normalized];
  }

  const quantityMatch = normalized.match(
    /^(\d+)\/(\d+)(ml|l|liter|liters|oz|ounce|ounces)$/
  );

  if (quantityMatch) {
    const [, quantity, size, unit] = quantityMatch;
    const numericQuantity = parseInt(quantity, 10);
    const numericSize = parseInt(size, 10);

    if (isNaN(numericQuantity) || isNaN(numericSize)) return 0;

    let sizeInMl: number;
    switch (unit) {
      case "ml":
        sizeInMl = numericSize;
        break;
      case "l":
      case "liter":
      case "liters":
        sizeInMl = numericSize * 1000;
        break;
      case "oz":
      case "ounce":
      case "ounces":
        sizeInMl = numericSize * 29.5735;
        break;
      default:
        return 0;
    }

    return numericQuantity * sizeInMl;
  }

  const match = normalized.match(
    /^([\d.]+)\s*(ml|l|liter|liters|oz|ounce|ounces)?$/
  );

  if (!match) return 0;

  const [, value, unit = "ml"] = match;
  const numericValue = parseFloat(value);

  if (isNaN(numericValue)) return 0;

  switch (unit) {
    case "":
    case "ml":
      return numericValue;
    case "l":
    case "liter":
    case "liters":
      return numericValue * 1000;
    case "oz":
    case "ounce":
    case "ounces":
      return numericValue * 29.5735;
    default:
      return 0;
  }
};

const convertMlToOz = (ml: number): number => ml / 29.5735;

const calculatePricing = (size: string, price: number) => {
  const sizeInMl = parseSizeToMl(size);
  const sizeInOz = convertMlToOz(sizeInMl);

  if (sizeInOz === 0 || !price) {
    return {
      pricePerOz: 0,
      sizeInMl: 0,
      sizeInOz: 0,
    };
  }

  return {
    pricePerOz: price / sizeInOz,
    sizeInMl,
    sizeInOz,
  };
};

const scrapePage = async (url: string): Promise<Array<ScrapedIngredient>> => {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  const ingredients: ScrapedIngredient[] = [];
  const category = url.split("/").pop() || "";

  $("tr").each((_, row) => {
    const code = $(row).find("td:first-child").text().trim();
    if (!code || code === "Code" || code.length !== 6) return;

    const size = $(row).find("td:nth-child(3)").text().trim();
    const salePrice = parseFloat($(row).find("td:nth-child(5)").text().trim());

    // Calculate normalized sizes and pricing
    const pricing = calculatePricing(size, salePrice);

    const ingredient: ScrapedIngredient = {
      code,
      brand: $(row).find("td:nth-child(2)").text().trim(),
      size,
      sizeInMl: pricing.sizeInMl,
      sizeInOz: pricing.sizeInOz,
      regularPrice: parseFloat($(row).find("td:nth-child(4)").text().trim()),
      salePrice,
      pricePerOz: pricing.pricePerOz,
      savings: parseFloat($(row).find("td:nth-child(6)").text().trim()),
      proof: parseFloat($(row).find("td:nth-child(7)").text().trim()),
      category,
      lastUpdated: new Date().toISOString(),
    };

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
    await connectDB();
    const ingredients = (
      await Promise.all(urlsToScrape.map(scrapePage))
    ).flat();

    // Group ingredients by normalized brand name
    const brandMap: Record<
      string,
      {
        category: string;
        sizes: Size[];
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
          category: ingredient.category,
          sizes: [],
        };
      }

      // Add size variant with normalized values
      brandMap[normalizedName].sizes.push({
        code: ingredient.code,
        size: ingredient.size,
        sizeInMl: ingredient.sizeInMl,
        sizeInOz: ingredient.sizeInOz,
        regularPrice: ingredient.regularPrice,
        salePrice: ingredient.salePrice,
        pricePerOz: ingredient.pricePerOz,
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
            createdBy: new mongoose.Types.ObjectId('679af24e5fbe614b370eeb3f'),
            lastUpdated: new Date().toISOString(),
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
