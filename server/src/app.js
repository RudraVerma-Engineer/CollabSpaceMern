import cors from "cors";
import express from "express";
import helmet from "helmet";

import env from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";

import { UPLOAD_DIR } from "./middleware/upload.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import collaborationRoutes from "./routes/collaboration.routes.js";
import githubRoutes from "./routes/github.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import postRoutes from "./routes/post.routes.js";
import projectRoutes from "./routes/project.routes.js";
import searchRoutes from "./routes/search.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

// ---- Global middleware ----------------------------------------------------
// Uploaded images are shown by the web app, which runs on another origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.clientUrls, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter);
app.use("/uploads", express.static(UPLOAD_DIR));

// ---- API routes -----------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/collaboration-requests", collaborationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/uploads", uploadRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CollabSpace API is running",
    timestamp: new Date().toISOString(),
  });
});

// ---- Errors ---------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
