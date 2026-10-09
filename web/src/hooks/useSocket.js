import { useCallback } from "react";

import { emitWithAck, socket } from "../socket/socket.js";

/** Chat-related socket actions. Receiving events is done with useSocketEvent. */
const useSocket = () => {
  const joinConversation = useCallback(
    (conversationId) => emitWithAck("conversation:join", { conversationId }),
    [],
  );

  const leaveConversation = useCallback((conversationId) => {
    if (socket.connected) {
      socket.emit("conversation:leave", { conversationId });
    }
  }, []);

  const sendMessage = useCallback(
    (conversationId, content, attachments = []) =>
      emitWithAck("message:send", { conversationId, content, attachments }),
    [],
  );

  const markMessageAsRead = useCallback((messageId) => {
    if (socket.connected) {
      socket.emit("message:read", { messageId });
    }
  }, []);

  const emitTyping = useCallback((conversationId, isTyping) => {
    if (socket.connected) {
      socket.emit(isTyping ? "typing:start" : "typing:stop", { conversationId });
    }
  }, []);

  return {
    socket,
    joinConversation,
    leaveConversation,
    sendMessage,
    markMessageAsRead,
    emitTyping,
  };
};

export default useSocket;
