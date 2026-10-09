import { useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../components/common/EmptyState.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import LoadMore from "../components/common/LoadMore.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import ProjectCard from "../components/projects/ProjectCard.jsx";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { usePaginatedList } from "../hooks/usePaginatedList.js";
import { getMyProjects, getProjects } from "../services/project.service.js";
import { PROJECT_STATUSES } from "../utils/constants.js";

const Projects = () => {
  const [tab, setTab] = useState("discover"); // "discover" | "mine"
  const [filters, setFilters] = useState({
    q: "",
    technology: "",
    status: "",
    lookingForCollaborators: false,
  });

  const debouncedText = useDebouncedValue({ q: filters.q, technology: filters.technology });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFilters((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  };

  const projects = usePaginatedList(
    (page) => {
      const params = {
        page,
        q: debouncedText.q || undefined,
        technology: debouncedText.technology || undefined,
        status: filters.status || undefined,
        lookingForCollaborators: filters.lookingForCollaborators || undefined,
      };

      return tab === "mine" ? getMyProjects(params) : getProjects(params);
    },
    "projects",
    [tab, debouncedText, filters.status, filters.lookingForCollaborators],
  );

  return (
    <div className="stack">
      <PageHeader
        title="Projects"
        subtitle="Find something to join, or share what you're building."
        actions={<Link to="/projects/new" className="btn btn-primary">New project</Link>}
      />

      <div className="tabs" role="tablist">
        {[["discover", "Discover"], ["mine", "My projects"]].map(([value, label]) => (
          <button key={value} role="tab" aria-selected={tab === value}
            className={`tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </div>

      <div className="filters">
        <input type="search" name="q" value={filters.q} onChange={handleChange}
          placeholder="Search projects" aria-label="Search projects" />
        <input type="search" name="technology" value={filters.technology} onChange={handleChange}
          placeholder="Technology, e.g. react" aria-label="Technology" />
        <select name="status" value={filters.status} onChange={handleChange} aria-label="Status">
          <option value="">Any status</option>
          {PROJECT_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <label className="checkbox">
          <input type="checkbox" name="lookingForCollaborators"
            checked={filters.lookingForCollaborators} onChange={handleChange} />
          Open to collaborators
        </label>
      </div>

      <ErrorMessage message={projects.error} />
      {projects.loading && <LoadingState />}

      {!projects.loading && projects.items.length === 0 && !projects.error && (
        <EmptyState title="No projects found">
          {tab === "mine" ? "Create a project or request to join one." : "Try changing your filters."}
        </EmptyState>
      )}

      <div className="card-grid">
        {projects.items.map((project) => <ProjectCard key={project._id} project={project} />)}
      </div>

      <LoadMore hasMore={projects.hasMore} loading={projects.loadingMore} onClick={projects.loadMore} />
    </div>
  );
};

export default Projects;
