import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import AppError from "../utils/AppError.js";
import { assertValidObjectId, isSameId } from "../utils/objectId.js";
import { buildPagination, getSkip } from "../utils/pagination.js";
import { containsRegex, normalizeList } from "../utils/text.js";
import { findProjectOrThrow, isProjectMember } from "./project.service.js";

const populatePost = (query) =>
  query
    .populate("author", "name avatar college")
    .populate("project", "title status");

/**
 * Clients never receive the `likes` / `savedBy` arrays, only counts and
 * what the *viewer* did (`likedByMe`, `savedByMe`).
 */
const serializePost = (post, viewerId) => {
  const { likes = [], savedBy = [], ...rest } = post.toObject();

  return {
    ...rest,
    likesCount: likes.length,
    likedByMe: likes.some((id) => isSameId(id, viewerId)),
    savedByMe: savedBy.some((id) => isSameId(id, viewerId)),
  };
};

export const createPost = async ({ authorId, data }) => {
  // A post can only point at a project the author belongs to.
  if (data.project) {
    const project = await findProjectOrThrow(data.project);

    if (!isProjectMember(project, authorId)) {
      throw new AppError("You can only link projects you belong to", 403);
    }
  }

  const post = await Post.create({
    ...data,
    tags: normalizeList(data.tags),
    author: authorId,
  });

  return serializePost(await populatePost(Post.findById(post._id)), authorId);
};

export const listPosts = async ({
  viewerId,
  saved,
  q,
  type,
  tag,
  author,
  project,
  page = 1,
  limit = 12,
}) => {
  const filter = {};

  if (q) filter.$or = [{ content: containsRegex(q) }, { tags: containsRegex(q) }];
  if (type) filter.type = type;
  if (tag) filter.tags = tag.trim().replace(/^#/, "").toLowerCase();
  if (author) filter.author = author;
  if (project) filter.project = project;
  if (saved) filter.savedBy = viewerId;

  const [posts, total] = await Promise.all([
    populatePost(
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip(getSkip({ page, limit }))
        .limit(limit),
    ),
    Post.countDocuments(filter),
  ]);

  return {
    posts: posts.map((post) => serializePost(post, viewerId)),
    pagination: buildPagination({ page, limit, total }),
  };
};

export const getPostById = async ({ postId, viewerId }) => {
  assertValidObjectId(postId, "post ID");

  const post = await populatePost(Post.findById(postId));

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  return serializePost(post, viewerId);
};

export const deletePost = async ({ postId, userId }) => {
  assertValidObjectId(postId, "post ID");

  const post = await Post.findById(postId);

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  if (!isSameId(post.author, userId)) {
    throw new AppError("You can only delete your own posts", 403);
  }

  await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
};

// ---------------------------------------------------------------------------
// Likes and saved posts: both are "toggle" actions on a list of user ids.
// ---------------------------------------------------------------------------

const toggleUserInList = async ({ postId, userId, field }) => {
  assertValidObjectId(postId, "post ID");

  const alreadyIn = await Post.exists({ _id: postId, [field]: userId });

  if (!alreadyIn && !(await Post.exists({ _id: postId }))) {
    throw new AppError("Post not found", 404);
  }

  const post = await Post.findOneAndUpdate(
    { _id: postId },
    alreadyIn ? { $pull: { [field]: userId } } : { $addToSet: { [field]: userId } },
    { returnDocument: "after" },
  );

  return { active: !alreadyIn, count: post[field].length };
};

export const toggleLike = async ({ postId, userId }) => {
  const { active, count } = await toggleUserInList({ postId, userId, field: "likes" });
  return { liked: active, likesCount: count };
};

export const toggleSave = async ({ postId, userId }) => {
  const { active } = await toggleUserInList({ postId, userId, field: "savedBy" });
  return { saved: active };
};
