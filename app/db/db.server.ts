import mongoose from "mongoose";

let isConnected = false;

export const DANIEL_USER_ID = '679af24e5fbe614b370eeb3f'

export async function connectDB() {
  if (isConnected) return;

  try {
    console.log('connecting to mongo uri at: ', process.env.MONGODB_URI)
    await mongoose.connect(process.env.MONGODB_URI!);
    isConnected = true;
    console.log('mongo ready state: ', mongoose.connection.readyState)
  } catch (error) {
    console.error("db connection error: ", error);
    throw error;
  }
}
