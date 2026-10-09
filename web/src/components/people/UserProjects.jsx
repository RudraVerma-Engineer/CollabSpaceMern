import ProjectCard from "../projects/ProjectCard.jsx";

/** "Projects owned" and "Projects joined" sections for a profile page. */
const UserProjects = ({ projects }) => (
  <>
    {[
      ["Projects", projects.owned, "No projects yet."],
      ["Joined projects", projects.joined, "Hasn't joined any other project yet."],
    ].map(([title, list, emptyText]) => (
      <section key={title}>
        <h2 className="section-heading">{title}</h2>
        {list.length === 0 ? (
          <p className="muted">{emptyText}</p>
        ) : (
          <div className="card-grid">
            {list.map((project) => <ProjectCard key={project._id} project={project} />)}
          </div>
        )}
      </section>
    ))}
  </>
);

export default UserProjects;
