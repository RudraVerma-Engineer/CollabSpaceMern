import { getRepositoryMetadata } from "../services/github.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getRepository = asyncHandler(async (req, res) => {
  const repository = await getRepositoryMetadata(req.validatedQuery.url);

  res.status(200).json({ success: true, data: { repository } });
});
