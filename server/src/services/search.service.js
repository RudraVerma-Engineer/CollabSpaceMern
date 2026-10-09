import { listPosts } from "./post.service.js";
import { listProjects } from "./project.service.js";
import { searchUsers } from "./user.service.js";

/**
 * Global search used by the search bar: a few matches from every area.
 * Dedicated, filterable searches live on each module's list endpoint
 * (`GET /api/users/search`, `/api/projects`, `/api/posts`).
 */
export const searchEverything = async ({ viewerId, q, limit = 5 }) => {
  const [users, projects, posts] = await Promise.all([
    searchUsers({ viewerId, q, limit }),
    listProjects({ q, limit }),
    listPosts({ viewerId, q, limit }),
  ]);

  return {
    users: users.users,
    projects: projects.projects,
    posts: posts.posts,
  };
};
