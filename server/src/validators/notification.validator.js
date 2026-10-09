import Joi from "joi";

import { paginationFields } from "./common.validator.js";

export const listNotificationsQuerySchema = Joi.object({
  unread: Joi.boolean().default(false),
  ...paginationFields,
  limit: Joi.number().integer().min(1).max(50).default(20),
});
