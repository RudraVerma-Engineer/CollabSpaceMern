import { useState } from "react";

import { uploadFile } from "../../services/upload.service.js";
import { updateProfile } from "../../services/user.service.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { getErrorMessage } from "../../utils/errors.js";
import { parseTags } from "../../utils/format.js";
import ErrorMessage from "../common/ErrorMessage.jsx";

const ProfileForm = ({ onDone }) => {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: user.name || "",
    bio: user.bio || "",
    college: user.college || "",
    skills: (user.skills || []).join(", "),
    githubProfile: user.githubProfile || "",
    avatar: user.avatar || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) =>
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleAvatarFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const uploaded = await uploadFile(file);
      setForm((previous) => ({ ...previous, avatar: uploaded.url }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await updateProfile({
        ...form,
        skills: parseTags(form.skills),
      });

      updateUser(response.data.user);
      toast.success("Profile saved");
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="college">College / university</label>
          <input id="college" name="college" type="text" value={form.college} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} maxLength={250}
          placeholder="What do you like to build?" />
      </div>

      <div className="form-group">
        <label htmlFor="skills">Skills</label>
        <input id="skills" name="skills" type="text" value={form.skills} onChange={handleChange}
          placeholder="react, node.js, python, ai/ml" />
        <span className="form-hint">Separate with commas. Others can find you by these.</span>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="githubProfile">GitHub profile</label>
          <input id="githubProfile" name="githubProfile" type="url" value={form.githubProfile}
            onChange={handleChange} placeholder="https://github.com/username" />
        </div>
        <div className="form-group">
          <label htmlFor="avatarFile">Profile photo</label>
          <input id="avatarFile" type="file" accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarFile} />
          {form.avatar && <span className="form-hint">Photo selected. Save to apply.</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onDone}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
