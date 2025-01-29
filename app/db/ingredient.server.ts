import mongoose from "mongoose";
import { Ingredient } from "~/types/index.type";

const sizeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  size: {
    type: String,
    required: true,
    trim: true,
  },
  sizeInMl: {  
    type: Number,
    required: true,
  },
  sizeInOz: { 
    type: Number,
    required: true,
  },
  regularPrice: {
    type: Number,
    required: true,
  },
  salePrice: {
    type: Number,
    required: true,
  },
  pricePerOz: { 
    type: Number,
    required: true,
  },
  savings: {
    type: Number,
    default: 0,
  },
  proof: {
    type: Number,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

export const IngredientModel =
  mongoose.models.Ingredient ||
  mongoose.model(
    "Ingredient",
    new mongoose.Schema({
      brand: {
        type: String,
        required: true,
        trim: true,
      },
      category: {
        type: String,
        required: true,
      },
      sizes: [sizeSchema],
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    })
  );

export const fromIngredientModel = (ingredient: any): Ingredient => {
  return {
    id: ingredient._id,
    brand: ingredient.brand,
    category: ingredient.category,
    lastUpdated: ingredient.lastUpdated.toISOString(),
    sizes: ingredient.sizes.map((s: any) => ({
      ...s,
      lastUpdated: s.lastUpdated.toISOString(),
    })),
    createdBy: ingredient.createdBy.toHexString(),
  };
};
