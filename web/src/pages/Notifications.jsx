import { useNavigate } from "react-router-dom";

import EmptyState from "../components/common/EmptyState.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import NotificationItem from "../components/inbox/NotificationItem.jsx";
import { useNotifications } from "../hooks/useNotifications.js";

/** Where a notification should take the person when clicked. */
const getNotificationLink = ({ type, data }) => {
  if (type === "new_message") return `/messages/${data.conversationId}`;
  if (type === "collaboration_request") return "/requests";
  if (type === "post_comment") return "/feed";
  if (type === "collaboration_accepted" && data.conversationId) return `/messages/${data.conversationId}`;
  if (data?.projectId) return `/projects/${data.projectId}`;
  return null;
};

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const open = (notification) => {
    markRead(notification._id);

    const link = getNotificationLink(notification);
    if (link) navigate(link);
  };

  return (
    <div className="stack">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
        actions={
          unreadCount > 0 && (
            <button type="button" className="btn" onClick={markAllRead}>Mark all as read</button>
          )
        }
      />

      {notifications.length === 0 && (
        <EmptyState title="Nothing here yet">
          Collaboration requests, project updates and new messages will appear here.
        </EmptyState>
      )}

      {notifications.map((notification) => (
        <NotificationItem key={notification._id} notification={notification} onOpen={open} />
      ))}
    </div>
  );
};

export default Notifications;
