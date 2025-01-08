import mongoose from "mongoose";

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
  regularPrice: {
    type: Number,
    required: true,
  },
  salePrice: {
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

const ingredientSchema = new mongoose.Schema({
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
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

export const IngredientModel = mongoose.model("Ingredient", ingredientSchema);
