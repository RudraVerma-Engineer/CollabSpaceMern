import express from "express";

import {
  create as createComment,
  list as listComments,
  remove as removeComment,
} from "../controllers/comment.controller.js";
import {
  create,
  getOne,
  like,
  list,
  remove,
  save,
} from "../controllers/post.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { idParamSchema, idParamsSchema } from "../validators/common.validator.js";
import {
  commentsQuerySchema,
  createCommentSchema,
  createPostSchema,
  listPostsQuerySchema,
} from "../validators/post.validator.js";

const router = express.Router();

router.use(protect);

const postIdParam = validate(idParamSchema("postId"), "params");

router.post("/", validate(createPostSchema), create);
router.get("/", validate(listPostsQuerySchema, "query"), list);
router.get("/:postId", postIdParam, getOne);
router.delete("/:postId", postIdParam, remove);

// Engagement
router.post("/:postId/like", postIdParam, like);
router.post("/:postId/save", postIdParam, save);

// Comments
router.get("/:postId/comments", postIdParam, validate(commentsQuerySchema, "query"), listComments);
router.post("/:postId/comments", postIdParam, validate(createCommentSchema), createComment);
router.delete(
  "/:postId/comments/:commentId",
  validate(idParamsSchema("postId", "commentId"), "params"),
  removeComment,
);

export default router;
