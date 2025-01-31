import type { LoaderFunction } from "@remix-run/node";
import * as cheerio from "cheerio";
import { connectDB } from "~/db/db.server";
import mongoose from "mongoose";
import { Ingredient, ProductSize, UnitEnum } from "~/types/index.type";
import {
  IngredientDocument,
  ProductSourceDocument,
  ProductSizeDocument,
  IngredientModel,
} from "~/db/ingredient.server";

interface ScrapedEntity {
  name: string;
  size: string;
  regularPrice: number;
  salePrice: number;
  savings: number;
  proof: number;
  category: string;
}

export const loader: LoaderFunction = async () => {
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
    const entities = (await Promise.all(urlsToScrape.map(scrapePage))).flat();

    // Group entities by name with proper type inference
    const ingredientsByName = entities.reduce<Record<string, Ingredient>>(
      (acc, e) => {
        const size = parseSize(e.size);
        if (size == null) {
          return acc;
        }
        if (e.name.endsWith(e.size)) {
          e.name = e.name.replace(e.size, "").trim();
        }

        // Create or get the ingredient
        if (!acc[e.name]) {
          acc[e.name] = {
            id: new mongoose.Types.ObjectId().toHexString(),
            name: e.name,
            sources: [],
            proof: e.proof,
            alcoholType: e.category,
          };
        }

        // Find or create the source
        let source = acc[e.name].sources.find((s) => s.name === "802 Spirits");
        if (!source) {
          source = {
            name: "802 Spirits",
            sizes: [],
          };
          acc[e.name].sources.push(source);
        }

        // Add size with pricing
        size.price = e.salePrice;
        size.discount = e.savings;
        size.unitPrice = e.salePrice / size.quantity;
        source.sizes.push(size);

        return acc;
      },
      {}
    );

    const ingredients = Object.values(ingredientsByName);
    const operations = ingredients.map((ingredient) => ({
      updateOne: {
        filter: { name: ingredient.name } as Partial<IngredientDocument>,
        update: {
          $set: {
            proof: ingredient.proof,
            alcoholType: ingredient.alcoholType,
            sources: ingredient.sources.map(
              (source): ProductSourceDocument => ({
                name: source.name,
                sizes: source.sizes.map(
                  (size): ProductSizeDocument => ({
                    unit: size.unit,
                    quantity: size.quantity,
                    price: size.price,
                    discount: size.discount,
                    unitPrice: size.unitPrice,
                  })
                ),
              })
            ),
          },
        },
        upsert: true,
      },
    }));

    const result = await IngredientModel.bulkWrite(operations);
    return {
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    };
  } catch (error) {
    console.error("Error updating ingredients:", error);
    throw error;
  }
};

const scrapePage = async (url: string): Promise<Array<ScrapedEntity>> => {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  const entities: ScrapedEntity[] = [];
  const category = url.split("/").pop() || "";

  $("tr").each((_, row) => {
    const entity: ScrapedEntity = {
      name: $(row).find("td:nth-child(2)").text().trim(),
      size: $(row).find("td:nth-child(3)").text().trim(),
      regularPrice: parseFloat($(row).find("td:nth-child(4)").text().trim()),
      salePrice: parseFloat($(row).find("td:nth-child(5)").text().trim()),
      savings: parseFloat($(row).find("td:nth-child(6)").text().trim()),
      proof: parseFloat($(row).find("td:nth-child(7)").text().trim()),
      category,
    };

    if (
      entity.name &&
      entity.size &&
      entity.category &&
      !isNaN(entity.regularPrice)
    ) {
      entities.push(entity);
    }
  });
  return entities;
};

const parseSize = (sizeStr: string): ProductSize | null => {
  if (!sizeStr) return null;
  const normalized = sizeStr.toString().toLowerCase().trim();
  if (!normalized) return null;

  const standaloneUnits: {
    [key: string]: { unit: UnitEnum; multiplier: number };
  } = {
    liter: { unit: UnitEnum.ml, multiplier: 1000 },
    liters: { unit: UnitEnum.ml, multiplier: 1000 },
    l: { unit: UnitEnum.ml, multiplier: 1000 },
    ml: { unit: UnitEnum.ml, multiplier: 1 },
    oz: { unit: UnitEnum.ml, multiplier: 29.5735 },
    ounce: { unit: UnitEnum.ml, multiplier: 29.5735 },
    ounces: { unit: UnitEnum.ml, multiplier: 29.5735 },
  };

  if (standaloneUnits[normalized]) {
    const { unit, multiplier } = standaloneUnits[normalized];
    return {
      unit,
      quantity: multiplier,
      price: 0,
      discount: 0,
      unitPrice: 0,
    };
  }

  const quantityMatch = normalized.match(
    /^(\d+)\/(\d+)(ml|l|liter|liters|oz|ounce|ounces)$/
  );
  if (quantityMatch) {
    const [, quantity, size, unit] = quantityMatch;
    const numericQuantity = parseInt(quantity, 10);
    const numericSize = parseInt(size, 10);
    if (isNaN(numericQuantity) || isNaN(numericSize)) return null;

    let multiplier: number;
    switch (unit) {
      case "ml":
        multiplier = 1;
        break;
      case "l":
      case "liter":
      case "liters":
        multiplier = 1000;
        break;
      case "oz":
      case "ounce":
      case "ounces":
        multiplier = 29.5735;
        break;
      default:
        return null;
    }

    return {
      unit: UnitEnum.ml,
      quantity: numericQuantity * numericSize * multiplier,
      price: 0,
      discount: 0,
      unitPrice: 0,
    };
  }

  const match = normalized.match(
    /^([\d.]+)\s*(ml|l|liter|liters|oz|ounce|ounces)?$/
  );
  if (!match) return null;

  const [, value, unit = "ml"] = match;
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return null;

  switch (unit) {
    case "":
    case "ml":
      return {
        unit: UnitEnum.ml,
        quantity: numericValue,
        price: 0,
        discount: 0,
        unitPrice: 0,
      };
    case "l":
    case "liter":
    case "liters":
      return {
        unit: UnitEnum.ml,
        quantity: numericValue * 1000,
        price: 0,
        discount: 0,
        unitPrice: 0,
      };
    case "oz":
    case "ounce":
    case "ounces":
      return {
        unit: UnitEnum.ml,
        quantity: numericValue * 29.5735,
        price: 0,
        discount: 0,
        unitPrice: 0,
      };
    default:
      return null;
  }
};
