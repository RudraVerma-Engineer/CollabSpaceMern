import mongoose from "mongoose";

import connectDB from "./config/db.js";
import env, { validateEnv } from "./config/env.js";
import { createHttpServer } from "./http-server.js";

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    const { httpServer, io } = createHttpServer();

    httpServer.listen(env.port, () => {
      console.log(`🚀 CollabSpace server running on port ${env.port}`);
      console.log(`📡 API: http://localhost:${env.port}/api`);
      console.log(`🔌 Socket.IO: http://localhost:${env.port}`);
    });

    // Graceful shutdown (Ctrl+C, container stop, ...)
    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      io.close();
      httpServer.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
