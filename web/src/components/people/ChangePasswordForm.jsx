import { useState } from "react";

import { changePassword } from "../../services/user.service.js";
import { useToast } from "../../hooks/useToast.js";
import { getErrorMessage } from "../../utils/errors.js";
import ErrorMessage from "../common/ErrorMessage.jsx";

const EMPTY = { currentPassword: "", newPassword: "" };

const ChangePasswordForm = () => {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) =>
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      await changePassword(form);
      toast.success("Password changed");
      setForm(EMPTY);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2 className="section-title">Change password</h2>
      <ErrorMessage message={error} />

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password"
            value={form.currentPassword} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" name="newPassword" type="password" autoComplete="new-password"
            value={form.newPassword} onChange={handleChange} minLength={6} required />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={saving}>{saving ? "Saving…" : "Update password"}</button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
