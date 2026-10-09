import { useNavigate, useParams } from "react-router-dom";

import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import ProjectForm from "../components/projects/ProjectForm.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { useToast } from "../hooks/useToast.js";
import { createProject, getProject, updateProject } from "../services/project.service.js";

/** /projects/new (create) and /projects/:projectId/edit (owner only). */
const ProjectEditor = () => {
  const { projectId } = useParams();
  const isEditing = Boolean(projectId);

  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error } = useFetch(
    () => (isEditing ? getProject(projectId) : Promise.resolve({ data: null })),
    [projectId],
  );

  if (isEditing && loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  if (isEditing && !data.viewer.isOwner) {
    return <ErrorMessage message="Only the project owner can edit this project." />;
  }

  const handleSubmit = async (payload) => {
    if (isEditing) {
      await updateProject(projectId, payload);
      toast.success("Project updated");
      navigate(`/projects/${projectId}`);
    } else {
      const response = await createProject(payload);
      toast.success("Project created");
      navigate(`/projects/${response.data.project._id}`);
    }
  };

  return (
    <div className="stack">
      <PageHeader title={isEditing ? "Edit project" : "New project"} />
      <ProjectForm
        project={data?.project}
        submitLabel={isEditing ? "Save changes" : "Create project"}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
};

export default ProjectEditor;
