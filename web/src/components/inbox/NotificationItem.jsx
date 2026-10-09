import { timeAgo } from "../../utils/format.js";

const NotificationItem = ({ notification, onOpen }) => (
  <button
    type="button"
    className={`notification-item ${notification.isRead ? "" : "unread"}`}
    onClick={() => onOpen(notification)}
  >
    <span className="notification-dot" aria-label={notification.isRead ? "" : "Unread"} />
    <span className="notification-body">
      <strong>{notification.title}</strong>
      {notification.message && <span className="muted">{notification.message}</span>}
      <span className="muted">{timeAgo(notification.updatedAt || notification.createdAt)}</span>
    </span>
  </button>
);

export default NotificationItem;
