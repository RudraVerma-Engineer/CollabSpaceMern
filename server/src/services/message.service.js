import Message from "../models/message.model.js";
import AppError from "../utils/AppError.js";
import { assertValidObjectId } from "../utils/objectId.js";
import { buildPagination, getSkip } from "../utils/pagination.js";
import { IMAGE_MIME_TYPES } from "../utils/constants.js";
import { attachmentSchema } from "../validators/message.validator.js";
import { emitToConversation } from "../sockets/emitters.js";
import { verifyConversationParticipant } from "./conversation.service.js";
import { notifyNewMessage } from "./notification.service.js";

const SENDER_FIELDS = "name email avatar";

/**
 * Persists a message, updates the conversation preview, pushes the message to
 * everybody in the conversation room and notifies the other participants.
 *
 * Used by both the Socket.IO handler and the REST fallback endpoint, so a
 * message is always real-time no matter how it was sent.
 */
/** Validates attachments coming from sockets (REST is validated by Joi). */
const sanitizeAttachments = (attachments = []) => {
  if (!Array.isArray(attachments) || attachments.length > 5) {
    throw new AppError("Invalid attachments", 400);
  }

  return attachments.map((attachment) => {
    const { error, value } = attachmentSchema.validate(attachment, { stripUnknown: true });

    if (error) throw new AppError("Invalid attachment", 400);
    return value;
  });
};

export const createMessage = async ({
  conversationId,
  userId,
  content = "",
  attachments = [],
  type,
}) => {
  const files = sanitizeAttachments(attachments);

  if (!content.trim() && files.length === 0) {
    throw new AppError("Message cannot be empty", 400);
  }

  // text | image (only images attached) | file | system (set by the server)
  const messageType =
    type ||
    (files.length === 0
      ? "text"
      : files.every((file) => IMAGE_MIME_TYPES.includes(file.mimeType))
        ? "image"
        : "file");

  const conversation = await verifyConversationParticipant({
    conversationId,
    userId,
  });

  const message = await Message.create({
    conversation: conversation._id,
    sender: userId,
    content: content.trim(),
    attachments: files,
    type: messageType,
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();

  await message.populate("sender", SENDER_FIELDS);

  emitToConversation(conversation._id, "message:new", message);

  if (messageType !== "system") {
    // Notification failures must never fail the message itself.
    notifyNewMessage({ conversation, message }).catch((error) =>
      console.error("❌ Failed to create message notification:", error.message),
    );
  }

  return message;
};

export const getConversationMessages = async ({
  conversationId,
  userId,
  page = 1,
  limit = 50,
}) => {
  await verifyConversationParticipant({ conversationId, userId });

  const filter = { conversation: conversationId, deletedAt: null };

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .populate("sender", SENDER_FIELDS)
      .sort({ createdAt: -1 })
      .skip(getSkip({ page, limit }))
      .limit(limit),
    Message.countDocuments(filter),
  ]);

  return {
    messages: messages.reverse(),
    pagination: buildPagination({ page, limit, total }),
  };
};

const findOwnMessage = async ({ messageId, userId }) => {
  assertValidObjectId(messageId, "message ID");

  const message = await Message.findOne({
    _id: messageId,
    sender: userId,
    deletedAt: null,
  });

  if (!message) {
    throw new AppError("Message not found or you are not the sender", 404);
  }

  return message;
};

export const editMessage = async ({ messageId, userId, content }) => {
  const message = await findOwnMessage({ messageId, userId });

  message.content = content;
  message.editedAt = new Date();
  await message.save();
  await message.populate("sender", SENDER_FIELDS);

  emitToConversation(message.conversation, "message:edited", message);

  return message;
};

export const deleteMessage = async ({ messageId, userId }) => {
  const message = await findOwnMessage({ messageId, userId });

  message.deletedAt = new Date();
  await message.save();

  emitToConversation(message.conversation, "message:deleted", {
    messageId: message._id,
    conversationId: message.conversation,
  });

  return message;
};

export const markMessageAsRead = async ({ messageId, userId }) => {
  assertValidObjectId(messageId, "message ID");

  const message = await Message.findById(messageId);

  if (!message) {
    throw new AppError("Message not found", 404);
  }

  await verifyConversationParticipant({
    conversationId: message.conversation,
    userId,
  });

  const alreadyRead = message.readBy.some(
    (entry) => entry.user.toString() === userId.toString(),
  );

  if (!alreadyRead) {
    message.readBy.push({ user: userId, readAt: new Date() });
    await message.save();
  }

  return message;
};
