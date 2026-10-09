import bcrypt from "bcryptjs";

import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { assertValidObjectId } from "../utils/objectId.js";
import { buildPagination, getSkip } from "../utils/pagination.js";
import { containsRegex, normalizeList } from "../utils/text.js";
import { getUserProjects } from "./project.service.js";

/** Fields other users are allowed to see. Never includes the email. */
export const PUBLIC_USER_FIELDS =
  "name avatar bio college skills githubProfile isOnline lastSeen createdAt";

const EDITABLE_PROFILE_FIELDS = [
  "name",
  "bio",
  "avatar",
  "college",
  "skills",
  "githubProfile",
];

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const updateUserProfile = async (userId, updates) => {
  const allowedUpdates = {};

  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (updates[field] !== undefined) {
      allowedUpdates[field] = updates[field];
    }
  }

  if (allowedUpdates.skills) {
    allowedUpdates.skills = normalizeList(allowedUpdates.skills);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.set(allowedUpdates);
  await user.save(); // runs the schema validators

  return user;
};

export const changeUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
    );
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
};

/** Discover developers by name, college or skill. Excludes the searcher. */
export const searchUsers = async ({
  viewerId,
  q,
  skill,
  page = 1,
  limit = 12,
}) => {
  const filter = { _id: { $ne: viewerId } };

  if (q) {
    const regex = containsRegex(q);
    filter.$or = [{ name: regex }, { college: regex }, { skills: regex }];
  }

  if (skill) {
    filter.skills = skill.trim().toLowerCase();
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(PUBLIC_USER_FIELDS)
      .sort({ name: 1 })
      .skip(getSkip({ page, limit }))
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { users, pagination: buildPagination({ page, limit, total }) };
};

/** Public profile + the projects the person owns or has joined. */
export const getPublicProfile = async (userId) => {
  assertValidObjectId(userId, "user ID");

  const user = await User.findById(userId).select(PUBLIC_USER_FIELDS);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const projects = await getUserProjects(userId);

  return { user, projects };
};
