import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    console.log('connect 1: ', process.env.MONGODB_URI)
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('connect 2')
    isConnected = true;
    console.log('ready state:', mongoose.connection.readyState)
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
