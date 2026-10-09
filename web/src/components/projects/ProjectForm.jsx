import { useState } from "react";

import { PROJECT_STATUSES } from "../../utils/constants.js";
import { getErrorMessage } from "../../utils/errors.js";
import { parseTags } from "../../utils/format.js";
import ErrorMessage from "../common/ErrorMessage.jsx";

const toFormState = (project) => ({
  title: project?.title || "",
  description: project?.description || "",
  status: project?.status || "idea",
  technologies: (project?.technologies || []).join(", "),
  requiredSkills: (project?.requiredSkills || []).join(", "),
  lookingForCollaborators: project?.lookingForCollaborators ?? true,
  githubRepository: project?.githubRepository || "",
  liveDemo: project?.liveDemo || "",
});

/** Used for both "create" and "edit": `onSubmit` receives the API payload. */
const ProjectForm = ({ project, onSubmit, submitLabel, onCancel }) => {
  const [form, setForm] = useState(() => toFormState(project));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await onSubmit({
        ...form,
        technologies: parseTags(form.technologies),
        requiredSkills: parseTags(form.requiredSkills),
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" type="text" value={form.title} onChange={handleChange}
          maxLength={100} required />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" value={form.description}
          onChange={handleChange} minLength={10} maxLength={2000} required
          placeholder="What are you building, and why?" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}>
            {PROJECT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="technologies">Technologies</label>
          <input id="technologies" name="technologies" type="text" value={form.technologies}
            onChange={handleChange} placeholder="react, node.js, mongodb" />
          <span className="form-hint">Separate with commas</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="requiredSkills">Skills you need</label>
        <input id="requiredSkills" name="requiredSkills" type="text" value={form.requiredSkills}
          onChange={handleChange} placeholder="ui design, python" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="githubRepository">GitHub repository</label>
          <input id="githubRepository" name="githubRepository" type="url"
            value={form.githubRepository} onChange={handleChange}
            placeholder="https://github.com/you/project" />
        </div>

        <div className="form-group">
          <label htmlFor="liveDemo">Live demo</label>
          <input id="liveDemo" name="liveDemo" type="url" value={form.liveDemo}
            onChange={handleChange} placeholder="https://" />
        </div>
      </div>

      <label className="checkbox">
        <input type="checkbox" name="lookingForCollaborators"
          checked={form.lookingForCollaborators} onChange={handleChange} />
        This project is looking for collaborators
      </label>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
