import mongoose from "mongoose";

import { REQUEST_STATUSES } from "../utils/constants.js";

const collaborationRequestSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Denormalised project owner so the owner's inbox is a single indexed query.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

collaborationRequestSchema.index({ owner: 1, status: 1, createdAt: -1 });
collaborationRequestSchema.index({ requester: 1, createdAt: -1 });

// Database-level guard: one *pending* request per user per project.
collaborationRequestSchema.index(
  { project: 1, requester: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

const CollaborationRequest = mongoose.model(
  "CollaborationRequest",
  collaborationRequestSchema,
);

export default CollaborationRequest;
