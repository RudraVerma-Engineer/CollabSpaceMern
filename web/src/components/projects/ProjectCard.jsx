import { Link } from "react-router-dom";

import ChipList from "../common/ChipList.jsx";
import StatusTrack from "./StatusTrack.jsx";

const ProjectCard = ({ project }) => (
  <article className="card project-card">
    <StatusTrack status={project.status} />

    <h3><Link to={`/projects/${project._id}`}>{project.title}</Link></h3>
    <p className="project-card-desc">{project.description}</p>

    <ChipList items={project.technologies} />

    {project.requiredSkills?.length > 0 && (
      <p className="muted">Looking for: {project.requiredSkills.join(", ")}</p>
    )}

    <footer className="project-card-footer">
      <span>
        by <Link to={`/people/${project.owner?._id}`}>{project.owner?.name}</Link> ·{" "}
        {project.members?.length} member{project.members?.length === 1 ? "" : "s"}
      </span>
      {project.lookingForCollaborators && <span className="badge badge-good">Open to collaborators</span>}
    </footer>
  </article>
);

export default ProjectCard;
