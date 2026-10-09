import rateLimit from "express-rate-limit";

import { isTest } from "../config/env.js";

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: { success: false, message },
  });

/** Brute-force protection for login / register. */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many attempts. Please try again in a few minutes.",
});

/** Generous global limit for the rest of the API. */
export const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: "Too many requests. Please slow down.",
});
