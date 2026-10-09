import Joi from "joi";

import { POST_TYPES } from "../utils/constants.js";
import { objectId, paginationFields, tagList } from "./common.validator.js";

export const createPostSchema = Joi.object({
  type: Joi.string().valid(...POST_TYPES).default("discussion"),
  content: Joi.string().trim().min(1).max(3000).required().messages({
    "string.empty": "Post content is required",
    "string.max": "Post cannot exceed 3000 characters",
    "any.required": "Post content is required",
  }),
  project: objectId.allow(null, ""),
  tags: tagList(10).default([]),
  media: Joi.array()
    .items(Joi.string().uri({ scheme: ["http", "https"], allowRelative: true }))
    .max(4)
    .default([]),
});

export const listPostsQuerySchema = Joi.object({
  q: Joi.string().trim().max(50).allow(""),
  type: Joi.string().valid(...POST_TYPES),
  tag: Joi.string().trim().max(30),
  author: objectId,
  project: objectId,
  saved: Joi.boolean(),
  ...paginationFields,
});

export const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required().messages({
    "string.empty": "Comment cannot be empty",
    "string.max": "Comment cannot exceed 1000 characters",
    "any.required": "Comment cannot be empty",
  }),
});

export const commentsQuerySchema = Joi.object({
  page: paginationFields.page,
  limit: Joi.number().integer().min(1).max(50).default(20),
});
