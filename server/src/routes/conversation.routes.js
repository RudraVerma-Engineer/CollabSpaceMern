import express from "express";

import {
  createDirect,
  createGroup,
  getForProject,
  getMyConversations,
} from "../controllers/conversation.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  createDirectConversationSchema,
  createGroupConversationSchema,
} from "../validators/conversation.validator.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyConversations);
router.post("/direct", validate(createDirectConversationSchema), createDirect);
router.post("/group", validate(createGroupConversationSchema), createGroup);
router.get(
  "/project/:projectId",
  validate(idParamSchema("projectId"), "params"),
  getForProject,
);

export default router;
