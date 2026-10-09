import mongoose from "mongoose";

import env from "./env.js";

const connectDB = async (uri = env.mongoUri) => {
  try {
    const connection = await mongoose.connect(uri);

    console.log(`🟢 MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
