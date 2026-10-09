import asyncHandler from "../utils/asyncHandler.js";

import {
  createMessage,
  getConversationMessages,
  editMessage,
  deleteMessage,
  markMessageAsRead,
} from "../services/message.service.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, attachments } = req.body;
  const message = await createMessage({
    conversationId,
    userId: req.user.userId,
    content,
    attachments,
  });

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: {
      message,
    },
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { page, limit } = req.validatedQuery;
  const { conversationId } = req.params;
  const result = await getConversationMessages({
    conversationId,
    userId: req.user.userId,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const updateMessage = asyncHandler(async (req, res) => {
  const message = await editMessage({
    messageId: req.params.messageId,
    userId: req.user.userId,
    content: req.body.content,
  });
  res.status(200).json({
    success: true,
    message: "Message updated successfully",
    data: {
      message,
    },
  });
});

export const removeMessage = asyncHandler(async (req, res) => {
  await deleteMessage({
    messageId: req.params.messageId,
    userId: req.user.userId,
  });
  res.status(200).json({
    success: true,
    message: "Message deleted successfully",
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await markMessageAsRead({
    messageId,
    userId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    message: "Message marked as read",
    data: {
      message,
    },
  });
});
