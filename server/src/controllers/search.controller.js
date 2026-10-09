import { searchEverything } from "../services/search.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const search = asyncHandler(async (req, res) => {
  const result = await searchEverything({
    viewerId: req.user.userId,
    ...req.validatedQuery,
  });

  res.status(200).json({ success: true, data: result });
});
