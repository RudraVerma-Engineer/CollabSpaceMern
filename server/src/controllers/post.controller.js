import {
  createPost,
  deletePost,
  getPostById,
  listPosts,
  toggleLike,
  toggleSave,
} from "../services/post.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const create = asyncHandler(async (req, res) => {
  const post = await createPost({ authorId: req.user.userId, data: req.body });

  res.status(201).json({
    success: true,
    message: "Post published",
    data: { post },
  });
});

export const list = asyncHandler(async (req, res) => {
  const result = await listPosts({ viewerId: req.user.userId, ...req.validatedQuery });

  res.status(200).json({ success: true, data: result });
});

export const getOne = asyncHandler(async (req, res) => {
  const post = await getPostById({ postId: req.params.postId, viewerId: req.user.userId });

  res.status(200).json({ success: true, data: { post } });
});

export const remove = asyncHandler(async (req, res) => {
  await deletePost({ postId: req.params.postId, userId: req.user.userId });

  res.status(200).json({ success: true, message: "Post deleted" });
});

export const like = asyncHandler(async (req, res) => {
  const result = await toggleLike({ postId: req.params.postId, userId: req.user.userId });

  res.status(200).json({ success: true, data: result });
});

export const save = asyncHandler(async (req, res) => {
  const result = await toggleSave({ postId: req.params.postId, userId: req.user.userId });

  res.status(200).json({ success: true, data: result });
});
