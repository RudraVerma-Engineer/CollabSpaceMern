import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { assertValidObjectId, isSameId } from "../utils/objectId.js";
import { buildPagination, getSkip } from "../utils/pagination.js";
import { truncate } from "../utils/text.js";
import { createNotification } from "./notification.service.js";

const findPostOrThrow = async (postId) => {
  assertValidObjectId(postId, "post ID");

  const post = await Post.findById(postId).select("author");

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  return post;
};

/** Oldest first, so a thread reads top to bottom. */
export const listComments = async ({ postId, page = 1, limit = 20 }) => {
  await findPostOrThrow(postId);

  const filter = { post: postId };

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate("author", "name avatar")
      .sort({ createdAt: 1 })
      .skip(getSkip({ page, limit }))
      .limit(limit),
    Comment.countDocuments(filter),
  ]);

  return { comments, pagination: buildPagination({ page, limit, total }) };
};

export const createComment = async ({ postId, userId, content }) => {
  const post = await findPostOrThrow(postId);

  const comment = await Comment.create({ post: post._id, author: userId, content });
  await Post.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });

  // Tell the post's author (but not about their own comments).
  if (!isSameId(post.author, userId)) {
    const commenter = await User.findById(userId).select("name");

    await createNotification({
      recipient: post.author,
      type: "post_comment",
      title: `${commenter.name} commented on your post`,
      message: truncate(content),
      data: { postId: post._id.toString() },
    });
  }

  return comment.populate("author", "name avatar");
};

/** The comment's author or the post's author may delete a comment. */
export const deleteComment = async ({ postId, commentId, userId }) => {
  assertValidObjectId(commentId, "comment ID");

  const [post, comment] = await Promise.all([
    findPostOrThrow(postId),
    Comment.findOne({ _id: commentId, post: postId }),
  ]);

  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  if (!isSameId(comment.author, userId) && !isSameId(post.author, userId)) {
    throw new AppError("You cannot delete this comment", 403);
  }

  await comment.deleteOne();
  await Post.updateOne({ _id: post._id }, { $inc: { commentsCount: -1 } });
};
