import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

/** Returns the metadata the client then attaches to a message / profile. */
export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file received (use the "file" field)', 400);
  }

  res.status(201).json({
    success: true,
    data: {
      file: {
        url: `/uploads/${req.file.filename}`,
        name: req.file.originalname.slice(0, 200),
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    },
  });
});
