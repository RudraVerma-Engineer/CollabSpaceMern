import Joi from "joi";

export const objectId = Joi.string().hex().length(24).messages({
  "string.hex": "{{#label}} must be a valid ID",
  "string.length": "{{#label}} must be a valid ID",
});

/** Validates a single ObjectId route param, e.g. `/:projectId`. */
export const idParamSchema = (name = "id") =>
  Joi.object({ [name]: objectId.required() });

/** Validates several ObjectId route params, e.g. `/:projectId/members/:userId`. */
export const idParamsSchema = (...names) =>
  Joi.object(Object.fromEntries(names.map((name) => [name, objectId.required()])));

export const paginationFields = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(12),
};

/** Tags, skills and technologies: short strings, limited count. */
export const tagList = (max = 15) =>
  Joi.array().items(Joi.string().trim().min(1).max(30)).max(max).messages({
    "array.max": `You can add at most ${max} items`,
  });

export const githubUrl = Joi.string()
  .trim()
  .uri({ scheme: ["http", "https"] })
  .pattern(/^https?:\/\/(www\.)?github\.com\//i)
  .allow("")
  .messages({ "string.pattern.base": "{{#label}} must be a github.com URL" });

export const httpUrl = Joi.string()
  .trim()
  .uri({ scheme: ["http", "https"] })
  .allow("");
