import Joi from "joi";

import { githubUrl, paginationFields, tagList } from "./common.validator.js";

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).messages({
    "string.min": "Name must contain at least 2 characters",
    "string.max": "Name cannot exceed 50 characters",
  }),
  bio: Joi.string().trim().max(250).allow("").messages({
    "string.max": "Bio cannot exceed 250 characters",
  }),
  avatar: Joi.string().uri({ allowRelative: true }).allow(null, "").messages({
    "string.uri": "Avatar must be a valid URL",
  }),
  college: Joi.string().trim().max(100).allow("").messages({
    "string.max": "College cannot exceed 100 characters",
  }),
  skills: tagList(20),
  githubProfile: githubUrl.label("GitHub profile"),
})
  .min(1)
  .messages({
    "object.min": "At least one profile field is required",
  });

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
    "any.required": "Current password is required",
  }),

  newPassword: Joi.string().min(6).max(100).required().messages({
    "string.empty": "New password is required",
    "string.min": "New password must contain at least 6 characters",
    "string.max": "New password cannot exceed 100 characters",
    "any.required": "New password is required",
  }),
});

export const searchUsersQuerySchema = Joi.object({
  q: Joi.string().trim().max(50).allow(""),
  skill: Joi.string().trim().max(30).allow(""),
  ...paginationFields,
});
