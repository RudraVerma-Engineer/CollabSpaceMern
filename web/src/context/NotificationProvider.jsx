import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getNotifications,
  markAllNotificationsRead,
  markConversationNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";
import { useAuth } from "../hooks/useAuth.js";
import { useSocketEvent } from "../hooks/useSocketEvent.js";

import NotificationContext from "./NotificationContext.jsx";

const EMPTY_STATE = { userId: null, items: [], unreadCount: 0 };

/**
 * Keeps the notification list + unread badge in sync:
 * loaded over REST, then updated live through `notification:new`.
 */
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id;
  const [loaded, setState] = useState(EMPTY_STATE);

  // Data belongs to one user: never show the previous user's notifications.
  const state = loaded.userId === userId ? loaded : EMPTY_STATE;

  // Initial load for the signed-in user.
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    getNotifications({ limit: 30 })
      .then((response) => {
        if (cancelled) return;
        setState({
          userId,
          items: response.data.notifications,
          unreadCount: response.data.unreadCount,
        });
      })
      .catch((error) => console.error("Failed to load notifications:", error));

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Live updates. A "new message" notification is updated in place by the
  // server, so the same id can arrive again: replace it instead of duplicating.
  useSocketEvent("notification:new", (incoming) => {
    setState((previous) => {
      const current = previous.userId === userId ? previous : { ...EMPTY_STATE, userId };
      const existing = current.items.find((item) => item._id === incoming._id);
      const items = [incoming, ...current.items.filter((item) => item._id !== incoming._id)];
      const wasUnread = existing && !existing.isRead;

      return {
        userId,
        items,
        unreadCount: wasUnread ? current.unreadCount : current.unreadCount + 1,
      };
    });
  });

  const markRead = useCallback(async (notificationId) => {
    setState((current) => {
      const target = current.items.find((item) => item._id === notificationId);
      if (!target || target.isRead) return current;

      return {
        ...current,
        items: current.items.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
        unreadCount: Math.max(0, current.unreadCount - 1),
      };
    });

    try {
      await markNotificationRead(notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  /** Opening a conversation clears its "new message" notification. */
  const markConversationRead = useCallback(async (conversationId) => {
    setState((current) => {
      const unreadForConversation = current.items.filter(
        (item) =>
          item.type === "new_message" &&
          !item.isRead &&
          item.data?.conversationId === conversationId,
      );

      if (unreadForConversation.length === 0) return current;

      return {
        ...current,
        items: current.items.map((item) =>
          unreadForConversation.includes(item) ? { ...item, isRead: true } : item,
        ),
        unreadCount: Math.max(0, current.unreadCount - unreadForConversation.length),
      };
    });

    try {
      await markConversationNotificationsRead(conversationId);
    } catch (error) {
      console.error("Failed to clear conversation notifications:", error);
    }
  }, []);

  // conversationId -> number of unread messages (for sidebar badges)
  const unreadByConversation = useMemo(() => {
    const counts = {};

    for (const item of state.items) {
      if (item.type === "new_message" && !item.isRead) {
        counts[item.data?.conversationId] = item.data?.count || 1;
      }
    }

    return counts;
  }, [state.items]);

  const value = useMemo(
    () => ({
      notifications: state.items,
      unreadCount: state.unreadCount,
      unreadMessageCount: Object.keys(unreadByConversation).length,
      unreadByConversation,
      markRead,
      markAllRead,
      markConversationRead,
    }),
    [state, unreadByConversation, markRead, markAllRead, markConversationRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
