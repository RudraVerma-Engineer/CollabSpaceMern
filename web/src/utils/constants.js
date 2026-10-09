export const POST_TYPES = [
  { value: "discussion", label: "Discussion" },
  { value: "showcase", label: "Showcase" },
  { value: "collaboration", label: "Looking for team" },
  { value: "question", label: "Question" },
  { value: "achievement", label: "Progress" },
];

export const PROJECT_STATUSES = [
  { value: "idea", label: "Idea" },
  { value: "planning", label: "Planning" },
  { value: "in_development", label: "In development" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
];

const toLabelMap = (items) =>
  Object.fromEntries(items.map(({ value, label }) => [value, label]));

export const POST_TYPE_LABELS = toLabelMap(POST_TYPES);
export const PROJECT_STATUS_LABELS = toLabelMap(PROJECT_STATUSES);

/** Same list the server accepts (see server/src/utils/constants.js). */
export const ALLOWED_FILE_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/zip,.doc,.docx";
