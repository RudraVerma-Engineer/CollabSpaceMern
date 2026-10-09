import express from "express";

import {
  accept,
  cancel,
  create,
  listReceived,
  listSent,
  reject,
} from "../controllers/collaboration.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { idParamSchema } from "../validators/common.validator.js";
import {
  createRequestSchema,
  listRequestsQuerySchema,
} from "../validators/collaboration.validator.js";

const router = express.Router();

router.use(protect);

const requestIdParam = validate(idParamSchema("requestId"), "params");

router.post("/", validate(createRequestSchema), create);
router.get("/received", validate(listRequestsQuerySchema, "query"), listReceived);
router.get("/sent", validate(listRequestsQuerySchema, "query"), listSent);

router.patch("/:requestId/accept", requestIdParam, accept);
router.patch("/:requestId/reject", requestIdParam, reject);
router.delete("/:requestId", requestIdParam, cancel);

export default router;
