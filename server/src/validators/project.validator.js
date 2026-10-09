import Joi from "joi";

import { PROJECT_STATUSES } from "../utils/constants.js";
import {
  githubUrl,
  httpUrl,
  objectId,
  paginationFields,
  tagList,
} from "./common.validator.js";

const projectFields = {
  title: Joi.string().trim().min(3).max(100).messages({
    "string.min": "Title must contain at least 3 characters",
    "string.max": "Title cannot exceed 100 characters",
    "string.empty": "Title is required",
  }),
  description: Joi.string().trim().min(10).max(2000).messages({
    "string.min": "Description must contain at least 10 characters",
    "string.max": "Description cannot exceed 2000 characters",
    "string.empty": "Description is required",
  }),
  technologies: tagList(20),
  requiredSkills: tagList(20),
  status: Joi.string().valid(...PROJECT_STATUSES),
  lookingForCollaborators: Joi.boolean(),
  githubRepository: githubUrl.label("GitHub repository"),
  liveDemo: httpUrl.label("Live demo"),
};

export const createProjectSchema = Joi.object({
  ...projectFields,
  title: projectFields.title.required(),
  description: projectFields.description.required(),
});

export const updateProjectSchema = Joi.object(projectFields)
  .min(1)
  .messages({ "object.min": "At least one field is required" });

export const listProjectsQuerySchema = Joi.object({
  q: Joi.string().trim().max(50).allow(""),
  technology: Joi.string().trim().max(30),
  skill: Joi.string().trim().max(30),
  status: Joi.string().valid(...PROJECT_STATUSES),
  lookingForCollaborators: Joi.boolean(),
  owner: objectId,
  member: objectId,
  ...paginationFields,
});
