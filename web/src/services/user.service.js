import api from "./api.js";

export const updateProfile = async (updates) =>
  (await api.patch("/users/me", updates)).data;

export const changePassword = async ({ currentPassword, newPassword }) =>
  (await api.patch("/users/me/password", { currentPassword, newPassword })).data;

export const searchUsers = async (params) =>
  (await api.get("/users/search", { params })).data;

export const getUserProfile = async (userId) =>
  (await api.get(`/users/${userId}`)).data;
