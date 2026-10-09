import express from "express";

import {
  changePassword,
  getMe,
  getProfile,
  search,
  updateProfile,
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  changePasswordSchema,
  searchUsersQuerySchema,
  updateProfileSchema,
} from "../validators/user.validator.js";

const router = express.Router();

router.use(protect);

// Current user. These must stay above "/:userId".
router.get("/me", getMe);
router.patch("/me", validate(updateProfileSchema), updateProfile);
router.patch("/me/password", validate(changePasswordSchema), changePassword);

// Discovery
router.get("/search", validate(searchUsersQuerySchema, "query"), search);
router.get("/:userId", validate(idParamSchema("userId"), "params"), getProfile);

export default router;
