import jwt from "jsonwebtoken";

import env from "../config/env.js";
import AppError from "../utils/AppError.js";

/** Requires `Authorization: Bearer <token>` and sets `req.user.userId`. */
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError("Authentication required", 401);
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new AppError("Invalid authorization format", 401);
    }

    const decoded = jwt.verify(parts[1], env.jwtSecret);

    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError("Invalid or expired token", 401));
  }
};
