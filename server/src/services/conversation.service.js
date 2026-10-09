import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { assertValidObjectId } from "../utils/objectId.js";

/**
 * The authorisation gate for everything chat related (REST *and* sockets).
 * Returns the conversation when `userId` is a participant, otherwise throws.
 */
export const verifyConversationParticipant = async ({
  conversationId,
  userId,
}) => {
  assertValidObjectId(conversationId, "conversation ID");

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError(
      "Conversation not found or you are not a participant",
      404,
    );
  }

  return conversation;
};

// ---------------------------------------------------------------------------
// Direct + group conversations
// ---------------------------------------------------------------------------

export const createDirectConversation = async ({ userId, participantId }) => {
  if (userId === participantId) {
    throw new AppError("You cannot create a conversation with yourself", 400);
  }

  assertValidObjectId(participantId, "participant ID");

  const participant = await User.findById(participantId);

  if (!participant) {
    throw new AppError("Participant not found", 404);
  }

  // Re-use the existing one-to-one conversation if there is one.
  const existingConversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: [userId, participantId], $size: 2 },
  });

  if (existingConversation) {
    return existingConversation;
  }

  return Conversation.create({
    type: "direct",
    participants: [userId, participantId],
    createdBy: userId,
  });
};

export const createGroupConversation = async ({
  userId,
  name,
  participantIds,
}) => {
  const uniqueParticipantIds = [...new Set([userId, ...participantIds])];

  if (uniqueParticipantIds.length < 2) {
    throw new AppError("A group must contain at least two participants", 400);
  }

  const users = await User.find({
    _id: { $in: uniqueParticipantIds },
  }).select("_id");

  if (users.length !== uniqueParticipantIds.length) {
    throw new AppError("One or more participants do not exist", 404);
  }

  return Conversation.create({
    type: "group",
    name,
    participants: uniqueParticipantIds,
    createdBy: userId,
  });
};

export const getUserConversations = async (userId) =>
  Conversation.find({ participants: userId })
    .populate("participants", "name email avatar isOnline")
    .populate("lastMessage", "sender content type createdAt")
    .populate("project", "title status")
    .sort({ lastMessageAt: -1, updatedAt: -1 });

/** Everyone the user shares a conversation with (used for presence updates). */
export const getContactIds = async (userId) => {
  const participantIds = await Conversation.find({
    participants: userId,
  }).distinct("participants");

  return participantIds
    .map((id) => id.toString())
    .filter((id) => id !== userId.toString());
};

// ---------------------------------------------------------------------------
// Project (team) conversations
// ---------------------------------------------------------------------------

export const createProjectConversation = ({ project }) =>
  Conversation.create({
    type: "project",
    name: project.title,
    project: project._id,
    participants: project.members,
    createdBy: project.owner,
  });

export const getProjectConversation = async ({ projectId, userId }) => {
  assertValidObjectId(projectId, "project ID");

  const conversation = await Conversation.findOne({
    project: projectId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError("Project conversation not found", 404);
  }

  return conversation;
};

export const addProjectConversationParticipant = ({ projectId, userId }) =>
  Conversation.findOneAndUpdate(
    { project: projectId },
    { $addToSet: { participants: userId } },
    { returnDocument: "after" },
  );

export const removeProjectConversationParticipant = ({ projectId, userId }) =>
  Conversation.updateOne(
    { project: projectId },
    { $pull: { participants: userId } },
  );

export const renameProjectConversation = ({ projectId, name }) =>
  Conversation.updateOne({ project: projectId }, { $set: { name } });

export const deleteProjectConversation = async (projectId) => {
  const conversation = await Conversation.findOneAndDelete({
    project: projectId,
  });

  if (conversation) {
    await Message.deleteMany({ conversation: conversation._id });
  }
};
