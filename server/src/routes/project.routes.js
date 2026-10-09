import express from "express";

import {
  create,
  getOne,
  list,
  listMine,
  remove,
  removeMember,
  update,
} from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
  idParamSchema,
  idParamsSchema,
} from "../validators/common.validator.js";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

const router = express.Router();

router.use(protect);

const projectIdParam = validate(idParamSchema("projectId"), "params");

router.post("/", validate(createProjectSchema), create);
router.get("/", validate(listProjectsQuerySchema, "query"), list);
router.get("/mine", validate(listProjectsQuerySchema, "query"), listMine); // above "/:projectId"
router.get("/:projectId", projectIdParam, getOne);
router.patch("/:projectId", projectIdParam, validate(updateProjectSchema), update);
router.delete("/:projectId", projectIdParam, remove);
router.delete(
  "/:projectId/members/:userId",
  validate(idParamsSchema("projectId", "userId"), "params"),
  removeMember,
);

export default router;
