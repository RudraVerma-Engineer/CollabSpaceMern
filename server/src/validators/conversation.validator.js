import Joi from "joi";

export const createDirectConversationSchema = Joi.object({
  participantId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Participant ID must be a valid MongoDB ID",
    "string.length": "Participant ID must be a valid MongoDB ID",
    "any.required": "Participant ID is required",
  }),
});

export const createGroupConversationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Group name must contain at least 2 characters",
    "string.max": "Group name cannot exceed 100 characters",
    "any.required": "Group name is required",
  }),
  participantIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .max(50)
    .required()
    .messages({
      "array.min": "A group must have at least one other participant",
      "array.max": "A group cannot have more than 50 participants",
      "any.required": "Participant Ids are required",
    }),
});
