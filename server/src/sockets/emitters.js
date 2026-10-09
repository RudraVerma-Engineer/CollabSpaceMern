import { getIO } from "./io.registry.js";

/**
 * Room naming conventions:
 *  - conversation:<id>  every socket that joined a conversation
 *  - user:<id>          every socket (tab/device) of one user
 */
export const getConversationRoom = (conversationId) =>
  `conversation:${conversationId}`;

export const getUserRoom = (userId) => `user:${userId}`;

const emitToRoom = (room, event, payload) => {
  // `null` when running without sockets (e.g. REST-only tests); that is fine.
  getIO()?.to(room).emit(event, payload);
};

export const emitToConversation = (conversationId, event, payload) =>
  emitToRoom(getConversationRoom(conversationId.toString()), event, payload);

export const emitToUser = (userId, event, payload) =>
  emitToRoom(getUserRoom(userId.toString()), event, payload);
