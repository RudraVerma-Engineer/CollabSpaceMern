import { useState } from "react";

import { createPost } from "../../services/post.service.js";
import { getMyProjects } from "../../services/project.service.js";
import { useFetch } from "../../hooks/useFetch.js";
import { useToast } from "../../hooks/useToast.js";
import { POST_TYPES } from "../../utils/constants.js";
import { getErrorMessage } from "../../utils/errors.js";
import { parseTags } from "../../utils/format.js";
import ErrorMessage from "../common/ErrorMessage.jsx";

const EMPTY_FORM = { type: "discussion", content: "", tags: "", project: "" };

const PostForm = ({ onCreated }) => {
  const toast = useToast();
  const { data } = useFetch(() => getMyProjects({ limit: 50 }), []);
  const myProjects = data?.projects || [];

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) =>
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await createPost({
        type: form.type,
        content: form.content,
        tags: parseTags(form.tags),
        project: form.project || null,
      });

      onCreated(response.data.post);
      setForm(EMPTY_FORM);
      toast.success("Post published");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card post-form" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      <label className="form-label" htmlFor="post-content">Share an update, question or idea</label>
      <textarea id="post-content" name="content" value={form.content} onChange={handleChange}
        placeholder="Looking for a React developer to join my project…" maxLength={3000} required />

      <div className="post-form-footer">
        <select name="type" value={form.type} onChange={handleChange} aria-label="Post type">
          {POST_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <select name="project" value={form.project} onChange={handleChange} aria-label="Linked project">
          <option value="">No project</option>
          {myProjects.map((project) => (
            <option key={project._id} value={project._id}>{project.title}</option>
          ))}
        </select>

        <input type="text" name="tags" value={form.tags} onChange={handleChange}
          placeholder="Tags: react, teamup" aria-label="Tags" />

        <button type="submit" className="btn btn-primary" disabled={saving || !form.content.trim()}>
          {saving ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
};

export default PostForm;
