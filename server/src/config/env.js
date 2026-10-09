import "dotenv/config";

/**
 * Single place where environment variables are read.
 * Everything else in the server imports `env` instead of touching process.env.
 */
const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  // Comma separated list, e.g. "http://localhost:5173,https://collabspace.app"
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
};

export const isProduction = env.nodeEnv === "production";
export const isTest = env.nodeEnv === "test";

/** Fail fast at startup when a required variable is missing. */
export const validateEnv = () => {
  const missing = [
    ["MONGO_URI", env.mongoUri],
    ["JWT_SECRET", env.jwtSecret],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
};

export default env;
