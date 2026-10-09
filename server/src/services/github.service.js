import AppError from "../utils/AppError.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // "owner/repo" -> { expiresAt, data }

/** "https://github.com/owner/repo(.git)/..." -> { owner, repo } */
export const parseRepositoryUrl = (url) => {
  const match = /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/i.exec(
    url || "",
  );

  if (!match) {
    throw new AppError("Please provide a valid GitHub repository URL", 400);
  }

  return { owner: match[1], repo: match[2] };
};

/**
 * Public repository details (stars, forks, language) from the GitHub API.
 * Results are cached for 10 minutes to stay far below GitHub's rate limit.
 * Optional: set GITHUB_TOKEN to raise the limit.
 */
export const getRepositoryMetadata = async (url) => {
  const { owner, repo } = parseRepositoryUrl(url);
  const key = `${owner}/${repo}`.toLowerCase();

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let response;
  try {
    response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "CollabSpace",
        ...(process.env.GITHUB_TOKEN && {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        }),
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new AppError("Could not reach GitHub. Try again later.", 502);
  }

  if (response.status === 404) {
    throw new AppError("Repository not found (is it public?)", 404);
  }

  if (!response.ok) {
    throw new AppError("GitHub is not available right now", 502);
  }

  const repository = await response.json();

  const data = {
    fullName: repository.full_name,
    description: repository.description,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    openIssues: repository.open_issues_count,
    language: repository.language,
    updatedAt: repository.pushed_at,
    url: repository.html_url,
  };

  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });

  return data;
};
