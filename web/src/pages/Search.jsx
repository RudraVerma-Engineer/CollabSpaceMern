import { Link, useSearchParams } from "react-router-dom";

import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import PostCard from "../components/posts/PostCard.jsx";
import ProjectCard from "../components/projects/ProjectCard.jsx";
import UserCard from "../components/people/UserCard.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useFetch } from "../hooks/useFetch.js";
import { searchAll } from "../services/search.service.js";

/** /search?q=react : a few results from people, projects and posts. */
const Search = () => {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const { user } = useAuth();

  const { data, loading, error } = useFetch(
    () => (q.length >= 2 ? searchAll(q) : Promise.resolve({ data: null })),
    [q],
  );

  const total = data ? data.users.length + data.projects.length + data.posts.length : 0;

  return (
    <div className="stack">
      <PageHeader title={q ? `Results for "${q}"` : "Search"}
        subtitle={q.length < 2 ? "Type at least 2 characters in the search bar." : undefined} />

      <ErrorMessage message={error} />
      {loading && <LoadingState />}
      {data && total === 0 && <p className="muted">Nothing matched. Try a broader word.</p>}

      {data?.users.length > 0 && (
        <section className="search-group">
          <h2 className="section-heading">People</h2>
          <div className="card-grid">
            {data.users.map((person) => (
              <UserCard key={person._id} user={person} onMessage={() => {}} />
            ))}
          </div>
          <p className="muted"><Link to="/people">Browse all people</Link></p>
        </section>
      )}

      {data?.projects.length > 0 && (
        <section className="search-group">
          <h2 className="section-heading">Projects</h2>
          <div className="card-grid">
            {data.projects.map((project) => <ProjectCard key={project._id} project={project} />)}
          </div>
        </section>
      )}

      {data?.posts.length > 0 && (
        <section className="search-group stack">
          <h2 className="section-heading">Posts</h2>
          {data.posts.map((post) => <PostCard key={post._id} post={post} currentUserId={user._id} />)}
        </section>
      )}
    </div>
  );
};

export default Search;
