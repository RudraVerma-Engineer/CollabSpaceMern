import Joi from "joi";

import { REQUEST_STATUSES } from "../utils/constants.js";
import { objectId, paginationFields } from "./common.validator.js";

export const createRequestSchema = Joi.object({
  projectId: objectId.required().messages({
    "any.required": "Project ID is required",
  }),
  message: Joi.string().trim().max(500).allow("").default("").messages({
    "string.max": "Message cannot exceed 500 characters",
  }),
});

export const listRequestsQuerySchema = Joi.object({
  status: Joi.string().valid(...REQUEST_STATUSES),
  ...paginationFields,
});
