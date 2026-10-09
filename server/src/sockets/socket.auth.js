import jwt from "jsonwebtoken";

import env from "../config/env.js";
import User from "../models/user.model.js";

/**
 * Socket.IO middleware: verifies the JWT sent in `auth.token`
 * and stores the user id on the socket (`socket.userId`).
 */
export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, env.jwtSecret);

    // Reject tokens that belong to a deleted account.
    const userExists = await User.exists({ _id: decoded.userId });

    if (!userExists) {
      return next(new Error("Invalid or expired token"));
    }

    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};
