import {
  createMessage,
  markMessageAsRead,
} from "../services/message.service.js";
import { verifyConversationParticipant } from "../services/conversation.service.js";
import { emitToConversation, getConversationRoom } from "./emitters.js";

/**
 * Wraps a handler so every event follows the same contract:
 *   client -> emit(event, payload, ack)
 *   server -> ack({ success: true, message?, data? })  or  ack({ success: false, message })
 */
const withAck = (handler) => async (payload, acknowledgement) => {
  try {
    const result = await handler(payload ?? {});
    acknowledgement?.({ success: true, ...result });
  } catch (error) {
    acknowledgement?.({ success: false, message: error.message });
  }
};

export const registerChatHandlers = (io, socket) => {
  // ---- conversation:join ---------------------------------------------------
  // Authorisation happens here: only participants may enter the room.
  socket.on(
    "conversation:join",
    withAck(async ({ conversationId }) => {
      await verifyConversationParticipant({
        conversationId,
        userId: socket.userId,
      });

      socket.join(getConversationRoom(conversationId));
      socket.emit("conversation:joined", { conversationId });

      return { message: "Conversation joined successfully" };
    }),
  );

  // ---- conversation:leave --------------------------------------------------
  socket.on(
    "conversation:leave",
    withAck(async ({ conversationId }) => {
      socket.leave(getConversationRoom(conversationId));

      return { message: "Conversation left successfully" };
    }),
  );

  // ---- message:send --------------------------------------------------------
  // The service persists the message and broadcasts `message:new` to the room.
  socket.on(
    "message:send",
    withAck(async ({ conversationId, content = "", attachments = [] }) => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }

      const message = await createMessage({
        conversationId,
        userId: socket.userId,
        content: String(content).trim(),
        attachments,
      });

      return { message: "Message sent successfully", data: { message } };
    }),
  );

  // ---- message:read --------------------------------------------------------
  socket.on(
    "message:read",
    withAck(async ({ messageId }) => {
      if (!messageId) {
        throw new Error("Message ID required");
      }

      const message = await markMessageAsRead({
        messageId,
        userId: socket.userId,
      });

      const readAt = message.readBy.find(
        (entry) => entry.user.toString() === socket.userId.toString(),
      )?.readAt;

      emitToConversation(message.conversation, "message:read", {
        messageId: message._id,
        conversationId: message.conversation,
        userId: socket.userId,
        readAt,
      });

      return { message: "Message marked as read" };
    }),
  );

  // ---- typing:start / typing:stop -----------------------------------------
  // Only sockets that already joined the room (and were therefore authorised)
  // may broadcast typing state. Nothing is persisted.
  for (const event of ["typing:start", "typing:stop"]) {
    socket.on(event, ({ conversationId } = {}) => {
      const room = getConversationRoom(conversationId);

      if (!socket.rooms.has(room)) return;

      socket.to(room).emit(event, { conversationId, userId: socket.userId });
    });
  }
};
