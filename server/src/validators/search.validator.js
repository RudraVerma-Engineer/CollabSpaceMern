import Joi from "joi";

export const globalSearchQuerySchema = Joi.object({
  q: Joi.string().trim().min(2).max(50).required().messages({
    "string.min": "Search must contain at least 2 characters",
    "any.required": "Search query is required",
    "string.empty": "Search query is required",
  }),
  limit: Joi.number().integer().min(1).max(10).default(5),
});
