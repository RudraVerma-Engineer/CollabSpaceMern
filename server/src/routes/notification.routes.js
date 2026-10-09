import express from "express";

import {
  list,
  markAllRead,
  markConversationRead,
  markRead,
  unreadCount,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validators/common.validator.js";
import { listNotificationsQuerySchema } from "../validators/notification.validator.js";

const router = express.Router();

router.use(protect);

router.get("/", validate(listNotificationsQuerySchema, "query"), list);
router.get("/unread-count", unreadCount);
router.patch("/read-all", markAllRead);
router.patch(
  "/conversation/:conversationId/read",
  validate(idParamSchema("conversationId"), "params"),
  markConversationRead,
);
router.patch(
  "/:notificationId/read",
  validate(idParamSchema("notificationId"), "params"),
  markRead,
);

export default router;
