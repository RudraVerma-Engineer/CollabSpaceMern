import mongoose from "mongoose";

import { POST_TYPES } from "../utils/constants.js";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: POST_TYPES,
      default: "discussion",
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
      maxlength: [3000, "Post cannot exceed 3000 characters"],
    },

    // Optional link to a project (showcase / collaboration posts).
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    tags: { type: [String], default: [] },

    // Image URLs (external, or "/uploads/..." from POST /api/uploads).
    media: { type: [String], default: [] },

    // Engagement. Arrays are never sent to clients; they get counts + "...ByMe".
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ savedBy: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
