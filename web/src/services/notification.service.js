import api from "./api.js";

export const getNotifications = async (params) =>
  (await api.get("/notifications", { params })).data;

export const markNotificationRead = async (notificationId) =>
  (await api.patch(`/notifications/${notificationId}/read`)).data;

export const markAllNotificationsRead = async () =>
  (await api.patch("/notifications/read-all")).data;

export const markConversationNotificationsRead = async (conversationId) =>
  (await api.patch(`/notifications/conversation/${conversationId}/read`)).data;
