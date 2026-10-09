import { getRepositoryStats } from "../../services/github.service.js";
import { useFetch } from "../../hooks/useFetch.js";

/** Stars / forks / language for a project's GitHub repository (best effort). */
const GithubStats = ({ url }) => {
  const { data, error } = useFetch(() => getRepositoryStats(url), [url]);

  if (error) return <p className="muted">GitHub stats unavailable: {error}</p>;
  if (!data) return <p className="muted">Loading GitHub stats…</p>;

  const repo = data.repository;

  return (
    <div className="github-stats">
      <a href={repo.url} target="_blank" rel="noreferrer"><strong>{repo.fullName}</strong></a>
      {repo.description && <p className="muted">{repo.description}</p>}
      <div className="row">
        <span className="badge">★ {repo.stars}</span>
        <span className="badge">⑂ {repo.forks}</span>
        {repo.language && <span className="badge badge-primary">{repo.language}</span>}
        <span className="badge">{repo.openIssues} open issues</span>
      </div>
    </div>
  );
};

export default GithubStats;
