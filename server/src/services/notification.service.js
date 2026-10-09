import Notification from "../models/notification.model.js";
import { emitToUser } from "../sockets/emitters.js";
import { assertValidObjectId } from "../utils/objectId.js";
import { buildPagination, getSkip } from "../utils/pagination.js";
import AppError from "../utils/AppError.js";
import { truncate } from "../utils/text.js";

/** Persists a notification and pushes it to the recipient in real time. */
export const createNotification = async ({
  recipient,
  type,
  title,
  message = "",
  data = {},
}) => {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    data,
  });

  emitToUser(recipient, "notification:new", notification);

  return notification;
};

/**
 * One *unread* "new message" notification per conversation per person.
 * Further messages update it (count + preview) instead of creating a flood.
 */
export const notifyNewMessage = async ({ conversation, message }) => {
  const senderName = message.sender?.name || "Someone";
  const conversationId = conversation._id.toString();
  const senderId = (message.sender?._id ?? message.sender).toString();

  const title =
    conversation.type === "direct"
      ? `New message from ${senderName}`
      : `${senderName} in ${conversation.name || "group chat"}`;

  const recipients = conversation.participants
    .map((participant) => participant.toString())
    .filter((participantId) => participantId !== senderId);

  await Promise.all(
    recipients.map(async (recipient) => {
      const notification = await Notification.findOneAndUpdate(
        {
          recipient,
          type: "new_message",
          isRead: false,
          "data.conversationId": conversationId,
        },
        {
          $set: {
            title,
            message: truncate(message.content || "Sent an attachment"),
            "data.messageId": message._id.toString(),
          },
          $inc: { "data.count": 1 },
        },
        { upsert: true, returnDocument: "after" },
      );

      emitToUser(recipient, "notification:new", notification);
    }),
  );
};

export const listNotifications = async ({
  userId,
  unreadOnly = false,
  page = 1,
  limit = 20,
}) => {
  const filter = { recipient: userId };
  if (unreadOnly) filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ updatedAt: -1 })
      .skip(getSkip({ page, limit }))
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: buildPagination({ page, limit, total }),
  };
};

export const getUnreadCount = (userId) =>
  Notification.countDocuments({ recipient: userId, isRead: false });

export const markNotificationRead = async ({ notificationId, userId }) => {
  assertValidObjectId(notificationId, "notification ID");

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } },
    { returnDocument: "after" },
  );

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  return notification;
};

export const markAllNotificationsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } },
  );
};

/** Called when a user opens a conversation. */
export const markConversationNotificationsRead = async ({
  conversationId,
  userId,
}) => {
  assertValidObjectId(conversationId, "conversation ID");

  await Notification.updateMany(
    {
      recipient: userId,
      type: "new_message",
      isRead: false,
      "data.conversationId": conversationId,
    },
    { $set: { isRead: true } },
  );
};
