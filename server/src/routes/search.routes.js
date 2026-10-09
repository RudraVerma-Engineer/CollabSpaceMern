import express from "express";

import { search } from "../controllers/search.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { globalSearchQuerySchema } from "../validators/search.validator.js";

const router = express.Router();

router.use(protect);

router.get("/", validate(globalSearchQuerySchema, "query"), search);

export default router;
