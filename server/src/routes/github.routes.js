import express from "express";
import Joi from "joi";

import { getRepository } from "../controllers/github.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(protect);

router.get(
  "/repository",
  validate(Joi.object({ url: Joi.string().trim().max(300).required() }), "query"),
  getRepository,
);

export default router;
