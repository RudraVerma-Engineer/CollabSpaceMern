import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

import multer from "multer";

import env from "../config/env.js";
import AppError from "../utils/AppError.js";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "../utils/constants.js";

export const UPLOAD_DIR = path.resolve(env.uploadDir);
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// The extension is derived from the *validated* MIME type, never from the
// client-supplied file name, and the stored name is random.
const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "application/zip": ".zip",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, callback) =>
      callback(null, `${randomUUID()}${EXTENSIONS[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, callback) => {
    if (ALLOWED_UPLOAD_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new AppError("This file type is not allowed", 400));
    }
  },
});
