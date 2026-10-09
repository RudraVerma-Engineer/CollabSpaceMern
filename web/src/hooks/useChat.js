import { useCallback, useEffect, useRef, useState } from "react";

import { deleteMessage, editMessage, getMessages } from "../services/message.service.js";
import { getErrorMessage } from "../utils/errors.js";
import { sameId } from "../utils/conversation.js";
import { useSocketEvent } from "./useSocketEvent.js";
import useSocket from "./useSocket.js";

const TYPING_IDLE_MS = 2000; // stop "typing" after this much silence
const TYPING_EXPIRE_MS = 5000; // forget a remote typer if no update arrives

const NO_MESSAGES = [];

const hasMessage = (messages, id) => messages.some((message) => message._id === id);

/**
 * Everything the chat window needs for ONE conversation:
 * history, live messages, optimistic sending, read receipts and typing.
 *
 * Components stay presentational; all socket/REST calls live here.
 */
export const useChat = (conversationId, currentUser) => {
  const {
    joinConversation,
    leaveConversation,
    sendMessage: sendOverSocket,
    markMessageAsRead,
    emitTyping,
  } = useSocket();

  // `conversationId` is stored with the data so stale data from the previous
  // conversation is never shown while the next one loads.
  const [state, setState] = useState({ conversationId: null, messages: [], error: "" });
  const [typingEntries, setTypingEntries] = useState([]);

  const requestedReadIds = useRef(new Set());
  const typingTimers = useRef(new Map());
  const isTypingRef = useRef(false);
  const stopTypingTimer = useRef(null);

  const isCurrent = state.conversationId === conversationId;
  const messages = isCurrent ? state.messages : NO_MESSAGES;

  /** Applies `update(messages)` only if we are still looking at `conversationId`. */
  const updateMessages = useCallback(
    (targetConversationId, update) =>
      setState((previous) =>
        previous.conversationId === targetConversationId
          ? { ...previous, messages: update(previous.messages) }
          : previous,
      ),
    [],
  );

  // ---- history + room membership ------------------------------------------
  const loadMessages = useCallback(
    () =>
      getMessages(conversationId)
        .then((response) =>
          setState({ conversationId, messages: response.data.messages, error: "" }),
        )
        .catch((error) =>
          setState({ conversationId, messages: [], error: getErrorMessage(error) }),
        ),
    [conversationId],
  );

  const joinRoom = useCallback(() => {
    joinConversation(conversationId).catch((error) =>
      console.error("Could not join conversation room:", error.message),
    );
  }, [conversationId, joinConversation]);

  useEffect(() => {
    if (!conversationId) return;

    joinRoom();
    loadMessages();

    return () => {
      leaveConversation(conversationId);
    };
  }, [conversationId, joinRoom, loadMessages, leaveConversation]);

  // After a reconnect the server has forgotten our rooms: rejoin and catch up.
  useSocketEvent("connect", () => {
    if (!conversationId) return;
    joinRoom();
    loadMessages();
  });

  // ---- live events ----------------------------------------------------------
  useSocketEvent("message:new", (message) => {
    const messageConversationId = message.conversation?._id || message.conversation;
    if (!sameId(messageConversationId, conversationId)) return;

    updateMessages(conversationId, (list) =>
      hasMessage(list, message._id) ? list : [...list, message],
    );

    // The sender is obviously not typing any more.
    setTypingEntries((entries) =>
      entries.filter((entry) => !sameId(entry.userId, message.sender)),
    );
  });

  useSocketEvent("message:edited", (message) => {
    updateMessages(conversationId, (list) =>
      list.map((item) => (item._id === message._id ? message : item)),
    );
  });

  useSocketEvent("message:deleted", ({ messageId }) => {
    updateMessages(conversationId, (list) => list.filter((item) => item._id !== messageId));
  });

  useSocketEvent("message:read", ({ messageId, userId, readAt }) => {
    updateMessages(conversationId, (list) =>
      list.map((item) =>
        item._id !== messageId || item.readBy?.some((entry) => sameId(entry.user, userId))
          ? item
          : { ...item, readBy: [...(item.readBy || []), { user: userId, readAt }] },
      ),
    );
  });

  const removeTypingEntry = useCallback((userId) => {
    clearTimeout(typingTimers.current.get(userId));
    typingTimers.current.delete(userId);
    setTypingEntries((entries) => entries.filter((entry) => !sameId(entry.userId, userId)));
  }, []);

  useSocketEvent("typing:start", ({ conversationId: typingConversationId, userId }) => {
    setTypingEntries((entries) =>
      entries.some((entry) => sameId(entry.userId, userId))
        ? entries
        : [...entries, { conversationId: typingConversationId, userId }],
    );

    // Safety net in case the "stop" event is lost.
    clearTimeout(typingTimers.current.get(userId));
    typingTimers.current.set(
      userId,
      setTimeout(() => removeTypingEntry(userId), TYPING_EXPIRE_MS),
    );
  });

  useSocketEvent("typing:stop", ({ userId }) => removeTypingEntry(userId));

  // ---- read receipts ------------------------------------------------------
  useEffect(() => {
    if (!currentUser?._id) return;

    for (const message of messages) {
      const isMine = sameId(message.sender, currentUser._id);
      const alreadyRead = message.readBy?.some((entry) => sameId(entry.user, currentUser._id));

      if (isMine || alreadyRead || message.type === "system") continue;
      if (message.status || requestedReadIds.current.has(message._id)) continue;

      requestedReadIds.current.add(message._id);
      markMessageAsRead(message._id);
    }
  }, [messages, currentUser, markMessageAsRead]);

  // ---- typing (outgoing) --------------------------------------------------
  const stopTyping = useCallback(() => {
    clearTimeout(stopTypingTimer.current);

    if (isTypingRef.current && conversationId) {
      isTypingRef.current = false;
      emitTyping(conversationId, false);
    }
  }, [conversationId, emitTyping]);

  const notifyTyping = useCallback(() => {
    if (!conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(conversationId, true);
    }

    clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [conversationId, emitTyping, stopTyping]);

  // Leaving a conversation (or the page) ends our typing state.
  useEffect(() => stopTyping, [stopTyping]);

  // ---- sending (optimistic) -----------------------------------------------
  const send = useCallback(
    async (content, attachments = []) => {
      const text = content.trim();
      if ((!text && attachments.length === 0) || !conversationId) return;

      stopTyping();

      const tempId = `temp-${crypto.randomUUID()}`;

      // 1. show the message immediately
      updateMessages(conversationId, (list) => [
        ...list,
        {
          _id: tempId,
          conversation: conversationId,
          content: text,
          attachments,
          type: "text",
          sender: {
            _id: currentUser._id,
            name: currentUser.name,
            avatar: currentUser.avatar,
          },
          createdAt: new Date().toISOString(),
          readBy: [],
          status: "sending",
        },
      ]);

      try {
        // 2. persist + broadcast via the server
        const response = await sendOverSocket(conversationId, text, attachments);
        const saved = response.data.message;

        // `message:new` may already have delivered the saved message: de-duplicate.
        updateMessages(conversationId, (list) => {
          const withoutTemp = list.filter((item) => item._id !== tempId);
          return hasMessage(withoutTemp, saved._id) ? withoutTemp : [...withoutTemp, saved];
        });
      } catch {
        // 3. let the person retry
        updateMessages(conversationId, (list) =>
          list.map((item) => (item._id === tempId ? { ...item, status: "failed" } : item)),
        );
      }
    },
    [conversationId, currentUser, sendOverSocket, stopTyping, updateMessages],
  );

  const discard = useCallback(
    (tempId) =>
      updateMessages(conversationId, (list) => list.filter((item) => item._id !== tempId)),
    [conversationId, updateMessages],
  );

  const retry = useCallback(
    (tempId) => {
      const failed = messages.find((item) => item._id === tempId);
      if (!failed) return;

      discard(tempId);
      send(failed.content, failed.attachments);
    },
    [messages, discard, send],
  );

  const edit = useCallback(
    async (messageId, content) => {
      const response = await editMessage(messageId, content);
      const saved = response.data.message;

      updateMessages(conversationId, (list) =>
        list.map((item) => (item._id === messageId ? saved : item)),
      );
    },
    [conversationId, updateMessages],
  );

  const remove = useCallback(
    async (messageId) => {
      await deleteMessage(messageId);
      updateMessages(conversationId, (list) => list.filter((item) => item._id !== messageId));
    },
    [conversationId, updateMessages],
  );

  const typingUserIds = typingEntries
    .filter((entry) => sameId(entry.conversationId, conversationId))
    .map((entry) => entry.userId);

  return {
    messages,
    loading: Boolean(conversationId) && !isCurrent,
    error: isCurrent ? state.error : "",
    typingUserIds,
    send,
    edit,
    remove,
    retry,
    discard,
    notifyTyping,
    stopTyping,
  };
};
