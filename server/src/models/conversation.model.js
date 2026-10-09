import mongoose from "mongoose";

import { CONVERSATION_TYPES } from "../utils/constants.js";

const conversationSchema = new mongoose.Schema(
  {
    // direct  -> exactly two participants
    // group   -> ad-hoc group chat
    // project -> team chat linked to a Project (see `project`)
    type: {
      type: String,
      enum: CONVERSATION_TYPES,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Conversation name cannot exceed 100 characters"],
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Only set for type === "project". One conversation per project.
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({
  participants: 1,
  lastMessageAt: -1,
});

// A project has at most one conversation.
conversationSchema.index(
  { project: 1 },
  { unique: true, partialFilterExpression: { project: { $type: "objectId" } } },
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
