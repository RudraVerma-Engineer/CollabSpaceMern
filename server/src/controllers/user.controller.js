import {
  changeUserPassword,
  getCurrentUser,
  getPublicProfile,
  searchUsers,
  updateUserProfile,
} from "../services/user.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMe = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.userId);

  res.status(200).json({ success: true, data: { user } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateUserProfile(req.user.userId, req.body);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  await changeUserPassword({
    userId: req.user.userId,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

export const search = asyncHandler(async (req, res) => {
  const result = await searchUsers({
    viewerId: req.user.userId,
    ...req.validatedQuery,
  });

  res.status(200).json({ success: true, data: result });
});

export const getProfile = asyncHandler(async (req, res) => {
  const result = await getPublicProfile(req.params.userId);

  res.status(200).json({ success: true, data: result });
});
