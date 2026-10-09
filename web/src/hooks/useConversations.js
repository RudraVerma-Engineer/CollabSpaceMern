import { useCallback, useEffect, useRef, useState } from "react";

import { getConversations } from "../services/conversation.service.js";
import { getErrorMessage } from "../utils/errors.js";
import { sameId } from "../utils/conversation.js";
import { useSocketEvent } from "./useSocketEvent.js";

const byMostRecent = (a, b) =>
  new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt);

/**
 * The conversation list shown in the sidebar, kept up to date live:
 *  - message:new / notification:new  -> new preview + moves to the top
 *  - presence:online / presence:offline -> online dots
 *  - accepted into a project -> the new team chat appears
 */
export const useConversations = () => {
  const [state, setState] = useState({ items: [], loading: true, error: "" });

  const refresh = useCallback(async () => {
    try {
      const response = await getConversations();

      setState({
        items: [...response.data.conversations].sort(byMostRecent),
        loading: false,
        error: "",
      });
    } catch (error) {
      setState((previous) => ({ ...previous, loading: false, error: getErrorMessage(error) }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Lets event handlers check what we already know without side effects
  // inside a state updater.
  const knownItemsRef = useRef([]);

  useEffect(() => {
    knownItemsRef.current = state.items;
  }, [state.items]);

  /** Shows a new last message for a conversation and moves it to the top. */
  const bumpConversation = useCallback(
    (conversationId, lastMessage) => {
      const isKnown = knownItemsRef.current.some((item) => sameId(item, conversationId));

      if (!isKnown) {
        refresh(); // e.g. a conversation someone else just started with us
        return;
      }

      setState((previous) => ({
        ...previous,
        items: previous.items
          .map((item) =>
            sameId(item, conversationId)
              ? { ...item, lastMessage, lastMessageAt: lastMessage.createdAt }
              : item,
          )
          .sort(byMostRecent),
      }));
    },
    [refresh],
  );

  useSocketEvent("message:new", (message) => {
    bumpConversation(message.conversation?._id || message.conversation, {
      _id: message._id,
      sender: message.sender?._id,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
    });
  });

  useSocketEvent("notification:new", (notification) => {
    if (notification.type === "new_message") {
      bumpConversation(notification.data.conversationId, {
        _id: notification.data.messageId,
        content: notification.message,
        type: "text",
        createdAt: notification.updatedAt || notification.createdAt,
      });
    }

    if (["collaboration_accepted", "project_member_added"].includes(notification.type)) {
      refresh();
    }
  });

  const setOnline = (userId, isOnline) =>
    setState((previous) => ({
      ...previous,
      items: previous.items.map((conversation) => ({
        ...conversation,
        participants: conversation.participants.map((participant) =>
          sameId(participant, userId) ? { ...participant, isOnline } : participant,
        ),
      })),
    }));

  useSocketEvent("presence:online", ({ userId }) => setOnline(userId, true));
  useSocketEvent("presence:offline", ({ userId }) => setOnline(userId, false));

  return {
    conversations: state.items,
    loading: state.loading,
    error: state.error,
    refresh,
  };
};
