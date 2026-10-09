/** Escapes user input so it can be safely used inside a RegExp. */
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-insensitive "contains" regex for search queries. */
export const containsRegex = (value) => new RegExp(escapeRegex(value.trim()), "i");

/**
 * Normalises a list of tags/skills/technologies:
 * trims, removes a leading "#", lowercases, removes duplicates.
 */
export const normalizeList = (list = []) => [
  ...new Set(
    list
      .map((item) => item.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean),
  ),
];

export const truncate = (text = "", maxLength = 80) =>
  text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
