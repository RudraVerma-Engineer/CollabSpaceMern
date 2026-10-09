/**
 * Shared enums. Models, validators and services all import from here so the
 * allowed values are defined exactly once.
 */
export const POST_TYPES = [
  "showcase", // showing a project
  "collaboration", // looking for teammates
  "question", // technical question
  "discussion", // general discussion
  "achievement", // progress / milestone
];

export const PROJECT_STATUSES = [
  "idea",
  "planning",
  "in_development",
  "completed",
  "paused",
];

export const REQUEST_STATUSES = ["pending", "accepted", "rejected", "cancelled"];

export const NOTIFICATION_TYPES = [
  "collaboration_request",
  "collaboration_accepted",
  "collaboration_rejected",
  "project_member_added",
  "post_comment",
  "new_message",
];

export const CONVERSATION_TYPES = ["direct", "group", "project"];

export const MESSAGE_TYPES = ["text", "image", "file", "system"];

/** Uploads: what people may attach to messages / use as avatars. */
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const FILE_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const ALLOWED_UPLOAD_TYPES = [...IMAGE_MIME_TYPES, ...FILE_MIME_TYPES];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
