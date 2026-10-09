import Joi from "joi";

import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "../utils/constants.js";

export const attachmentSchema = Joi.object({
  url: Joi.string().pattern(/^\/uploads\/[\w.-]+$/).required(),
  name: Joi.string().trim().max(200).required(),
  mimeType: Joi.string().valid(...ALLOWED_UPLOAD_TYPES).required(),
  size: Joi.number().integer().min(0).max(MAX_UPLOAD_BYTES).default(0),
});

// A message needs text, attachments, or both.
export const sendMessageSchema = Joi.object({
  content: Joi.string().trim().max(5000).allow("").default("").messages({
    "string.max": "Message cannot exceed 5000 characters",
  }),
  attachments: Joi.array().items(attachmentSchema).max(5).default([]),
}).custom((value, helpers) =>
  !value.content && value.attachments.length === 0
    ? helpers.message("Message cannot be empty")
    : value,
);

export const editMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required().messages({
    "string.empty": "Message content is required",
    "string.min": "Message cannot be empty",
    "string.max": "Message cannot exceed 5000 characters",
    "any.required": "Message content is required",
  }),
});

// get message history
export const getMessageQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
});
