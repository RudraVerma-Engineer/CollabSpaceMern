const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export const timeAgo = (dateString) => {
  if (!dateString) return "";

  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

  if (seconds < 45) return "just now";
  if (seconds < HOUR) return `${Math.max(1, Math.floor(seconds / MINUTE))}m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;
  if (seconds < 7 * DAY) return `${Math.floor(seconds / DAY)}d ago`;

  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatMessageTime = (dateString) =>
  dateString
    ? new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

/** "react, node.js" -> ["react", "node.js"] */
export const parseTags = (text = "") =>
  text
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";
