import mongoose from "mongoose";

import { PROJECT_STATUSES } from "../utils/constants.js";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must contain at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Always contains the owner, plus every accepted collaborator.
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    technologies: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },

    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: "idea",
    },

    // When false, the project is hidden from "looking for collaborators"
    // filters and new collaboration requests are rejected.
    lookingForCollaborators: {
      type: Boolean,
      default: true,
    },

    githubRepository: { type: String, trim: true, default: "" },
    liveDemo: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
  },
);

projectSchema.index({ members: 1 });
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ technologies: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
