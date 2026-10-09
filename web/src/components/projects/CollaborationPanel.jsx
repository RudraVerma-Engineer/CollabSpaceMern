import { useState } from "react";

import { cancelRequest, sendCollaborationRequest } from "../../services/collaboration.service.js";
import { useToast } from "../../hooks/useToast.js";
import { getErrorMessage } from "../../utils/errors.js";
import ErrorMessage from "../common/ErrorMessage.jsx";

/** "Request to collaborate" box for people who are not yet on the project. */
const CollaborationPanel = ({ project, pendingRequestId, onChanged }) => {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action, successMessage) => {
    setError("");
    setBusy(true);

    try {
      await action();
      toast.success(successMessage);
      setMessage("");
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!project.lookingForCollaborators) {
    return (
      <div className="card">
        <h3 className="section-title">Collaboration</h3>
        <p className="muted">This project is not looking for collaborators right now.</p>
      </div>
    );
  }

  if (pendingRequestId) {
    return (
      <div className="card request-panel">
        <h3 className="section-title">Request sent</h3>
        <p className="muted" style={{ marginBottom: 12 }}>
          Waiting for the owner to respond. You will get a notification.
        </p>
        <ErrorMessage message={error} />
        <button type="button" className="btn btn-sm" disabled={busy}
          onClick={() => run(() => cancelRequest(pendingRequestId), "Request cancelled")}>
          Cancel request
        </button>
      </div>
    );
  }

  return (
    <div className="card request-panel">
      <h3 className="section-title">Want to join?</h3>
      <ErrorMessage message={error} />
      <textarea value={message} onChange={(event) => setMessage(event.target.value)}
        placeholder="Tell the owner why you'd be a good fit (optional)" maxLength={500}
        aria-label="Message to the project owner" />
      <button type="button" className="btn btn-primary" disabled={busy}
        onClick={() =>
          run(
            () => sendCollaborationRequest({ projectId: project._id, message }),
            "Request sent",
          )
        }>
        {busy ? "Sending…" : "Request to collaborate"}
      </button>
    </div>
  );
};

export default CollaborationPanel;
