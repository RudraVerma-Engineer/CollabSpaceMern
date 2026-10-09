import {
  createComment,
  deleteComment,
  listComments,
} from "../services/comment.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const result = await listComments({
    postId: req.params.postId,
    ...req.validatedQuery,
  });

  res.status(200).json({ success: true, data: result });
});

export const create = asyncHandler(async (req, res) => {
  const comment = await createComment({
    postId: req.params.postId,
    userId: req.user.userId,
    content: req.body.content,
  });

  res.status(201).json({ success: true, data: { comment } });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteComment({
    postId: req.params.postId,
    commentId: req.params.commentId,
    userId: req.user.userId,
  });

  res.status(200).json({ success: true, message: "Comment deleted" });
});
