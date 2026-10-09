import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markConversationNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const list = asyncHandler(async (req, res) => {
  const { unread, page, limit } = req.validatedQuery;

  const result = await listNotifications({
    userId: req.user.userId,
    unreadOnly: unread,
    page,
    limit,
  });

  res.status(200).json({ success: true, data: result });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await getUnreadCount(req.user.userId);

  res.status(200).json({ success: true, data: { count } });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead({
    notificationId: req.params.notificationId,
    userId: req.user.userId,
  });

  res.status(200).json({ success: true, data: { notification } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await markAllNotificationsRead(req.user.userId);

  res.status(200).json({ success: true, message: "All notifications marked as read" });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  await markConversationNotificationsRead({
    conversationId: req.params.conversationId,
    userId: req.user.userId,
  });

  res.status(200).json({ success: true, message: "Conversation notifications marked as read" });
});
