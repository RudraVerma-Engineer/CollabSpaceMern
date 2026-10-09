import {
  createDirectConversation,
  createGroupConversation,
  getProjectConversation,
  getUserConversations,
} from "../services/conversation.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createDirect = asyncHandler(async (req, res) => {
  const conversation = await createDirectConversation({
    userId: req.user.userId,
    participantId: req.body.participantId,
  });

  res.status(201).json({
    success: true,
    message: "Direct conversation created successfully",
    data: { conversation },
  });
});

export const createGroup = asyncHandler(async (req, res) => {
  const conversation = await createGroupConversation({
    userId: req.user.userId,
    name: req.body.name,
    participantIds: req.body.participantIds,
  });

  res.status(201).json({
    success: true,
    message: "Group conversation created successfully",
    data: { conversation },
  });
});

export const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await getUserConversations(req.user.userId);

  res.status(200).json({ success: true, data: { conversations } });
});

export const getForProject = asyncHandler(async (req, res) => {
  const conversation = await getProjectConversation({
    projectId: req.params.projectId,
    userId: req.user.userId,
  });

  res.status(200).json({ success: true, data: { conversation } });
});
