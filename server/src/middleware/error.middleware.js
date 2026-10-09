import { isProduction } from "../config/env.js";

/**
 * Converts known library errors (Mongoose, JWT) into friendly API errors.
 * Returns `{ statusCode, message }`.
 */
const normalizeError = (err) => {
  if (err.name === "ValidationError" && err.errors) {
    return {
      statusCode: 400,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
    };
  }

  if (err.name === "CastError") {
    return { statusCode: 400, message: `Invalid ${err.path}` };
  }

  if (err.code === 11000) {
    return { statusCode: 409, message: "A record with these details already exists" };
  }

  if (err.name === "MulterError") {
    return {
      statusCode: 400,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "File is too large (max 5 MB)"
          : "Invalid file upload",
    };
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return { statusCode: 401, message: "Invalid or expired token" };
  }

  return { statusCode: err.statusCode || 500, message: err.message };
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = normalizeError(err);

  // Log unexpected errors only; expected ones (AppError) are noise.
  if (statusCode >= 500) {
    console.error("❌ Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && isProduction ? "Internal server error" : message,
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
