import { Link, useNavigate, useParams } from "react-router-dom";

import ChipList from "../components/common/ChipList.jsx";
import ConfirmButton from "../components/common/ConfirmButton.jsx";
import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import CollaborationPanel from "../components/projects/CollaborationPanel.jsx";
import MemberList from "../components/projects/MemberList.jsx";
import GithubStats from "../components/projects/GithubStats.jsx";
import StatusTrack from "../components/projects/StatusTrack.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useFetch } from "../hooks/useFetch.js";
import { useToast } from "../hooks/useToast.js";
import { deleteProject, getProject, removeProjectMember } from "../services/project.service.js";
import { getErrorMessage } from "../utils/errors.js";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error, reload } = useFetch(() => getProject(projectId), [projectId]);

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorMessage message={error} />;

  const { project, viewer } = data;

  const run = async (action, successMessage, afterwards) => {
    try {
      await action();
      toast.success(successMessage);
      afterwards();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="project-layout">
      <div className="stack">
        <article className="card stack">
          <StatusTrack status={project.status} />
          <div className="row-between">
            <h1>{project.title}</h1>
            {viewer.isOwner && (
              <div className="row">
                <Link to={`/projects/${project._id}/edit`} className="btn btn-sm">Edit</Link>
                <ConfirmButton
                  title="Delete this project?"
                  message="The team chat, its messages and all collaboration requests will be deleted too."
                  confirmLabel="Delete project"
                  onConfirm={() => run(() => deleteProject(project._id), "Project deleted", () => navigate("/projects"))}
                >
                  Delete
                </ConfirmButton>
              </div>
            )}
          </div>

          <p className="project-description">{project.description}</p>

          {project.technologies.length > 0 && (
            <section><h3 className="section-title">Technologies</h3><ChipList items={project.technologies} /></section>
          )}

          {project.requiredSkills.length > 0 && (
            <section><h3 className="section-title">Skills needed</h3><ChipList items={project.requiredSkills} /></section>
          )}

          {project.githubRepository && <GithubStats url={project.githubRepository} />}

          {(project.githubRepository || project.liveDemo) && (
            <div className="link-list">
              {project.githubRepository && <a className="btn btn-sm" href={project.githubRepository} target="_blank" rel="noreferrer">GitHub repository</a>}
              {project.liveDemo && <a className="btn btn-sm" href={project.liveDemo} target="_blank" rel="noreferrer">Live demo</a>}
            </div>
          )}
        </article>
      </div>

      <aside className="stack">
        {viewer.isMember ? (
          <div className="card stack">
            <h3 className="section-title">Your team</h3>
            {viewer.conversationId && (
              <Link to={`/messages/${viewer.conversationId}`} className="btn btn-primary">Open team chat</Link>
            )}
            {!viewer.isOwner && (
              <ConfirmButton
                title="Leave this project?"
                message="You will lose access to the team chat. You can send a new request later."
                confirmLabel="Leave project"
                className="btn btn-danger"
                onConfirm={() => run(() => removeProjectMember(project._id, user._id), "You left the project", reload)}
              >
                Leave project
              </ConfirmButton>
            )}
          </div>
        ) : (
          <CollaborationPanel project={project} pendingRequestId={viewer.pendingRequestId} onChanged={reload} />
        )}

        <div className="card">
          <h3 className="section-title">Members ({project.members.length})</h3>
          <MemberList
            project={project}
            canRemove={viewer.isOwner}
            onRemove={(member) => run(() => removeProjectMember(project._id, member._id), `${member.name} removed`, reload)}
          />
        </div>
      </aside>
    </div>
  );
};

export default ProjectDetail;
