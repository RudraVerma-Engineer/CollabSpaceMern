import { SOCKET_URL } from "../config/env.js";

/** Uploaded files are stored as "/uploads/x.png"; prefix the API origin. */
export const assetUrl = (path) =>
  path?.startsWith("/uploads/") ? `${SOCKET_URL}${path}` : path;

export const formatFileSize = (bytes = 0) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
