import express from "express";

import {
  sendMessage,
  getMessages,
  updateMessage,
  removeMessage,
  markAsRead,
} from "../controllers/message.controller.js";

import { protect } from "../middleware/auth.middleware.js";

import validate from "../middleware/validate.middleware.js";

import {
  sendMessageSchema,
  editMessageSchema,
  getMessageQuerySchema,
} from "../validators/message.validator.js";

const router = express.Router();

router.use(protect);

router.post("/:conversationId", validate(sendMessageSchema), sendMessage);

router.get(
  "/:conversationId",
  validate(getMessageQuerySchema, "query"),
  getMessages,
);

router.patch("/message/:messageId", validate(editMessageSchema), updateMessage);

router.delete("/message/:messageId", removeMessage);

router.patch("/message/:messageId/read", markAsRead);

export default router;
