import { useState } from "react";

import { assetUrl, formatFileSize } from "../../utils/assets.js";
import { formatMessageTime } from "../../utils/format.js";

const Attachments = ({ attachments }) => (
  <div className="message-attachments">
    {attachments.map((file) =>
      file.mimeType.startsWith("image/") ? (
        <a key={file.url} href={assetUrl(file.url)} target="_blank" rel="noreferrer">
          <img src={assetUrl(file.url)} alt={file.name} className="message-image" />
        </a>
      ) : (
        <a key={file.url} href={assetUrl(file.url)} target="_blank" rel="noreferrer" className="message-file">
          📎 {file.name} <span>{formatFileSize(file.size)}</span>
        </a>
      ),
    )}
  </div>
);

/** One message. `status` is only set on optimistic (not yet confirmed) messages. */
const MessageBubble = ({
  message,
  isOwn,
  showSender,
  seenByOthers,
  onRetry,
  onDiscard,
  onEdit,
  onDelete,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  if (message.type === "system") {
    return <div className="message-system">{message.content}</div>;
  }

  const stateClass =
    message.status === "failed" ? "message-failed" : message.status === "sending" ? "message-sending" : "";
  const canModify = isOwn && !message.status;

  const saveEdit = async (event) => {
    event.preventDefault();

    if (draft.trim() && draft.trim() !== message.content) {
      await onEdit(message._id, draft.trim());
    }
    setEditing(false);
  };

  return (
    <div className={`message-row ${isOwn ? "message-row-own" : "message-row-other"}`}>
      <div className={`message ${isOwn ? "message-own" : "message-other"} ${stateClass}`}>
        {showSender && <div className="message-sender">{message.sender?.name || "Unknown"}</div>}

        {message.attachments?.length > 0 && <Attachments attachments={message.attachments} />}

        {editing ? (
          <form className="message-edit" onSubmit={saveEdit}>
            <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
              aria-label="Edit message" autoFocus maxLength={5000} />
            <button type="submit" className="btn-link">Save</button>
            <button type="button" className="btn-link" onClick={() => { setDraft(message.content); setEditing(false); }}>
              Cancel
            </button>
          </form>
        ) : (
          message.content && <div className="message-content">{message.content}</div>
        )}

        <div className="message-meta">
          {message.editedAt && <span>edited</span>}
          <span>{formatMessageTime(message.createdAt)}</span>
          {isOwn && !message.status && <span>{seenByOthers ? "Seen" : "Sent"}</span>}
          {message.status === "sending" && <span>Sending…</span>}
          {message.status === "failed" && (
            <>
              <span>Not sent</span>
              <button type="button" className="btn-link" onClick={() => onRetry(message._id)}>Retry</button>
              <button type="button" className="btn-link" onClick={() => onDiscard(message._id)}>Discard</button>
            </>
          )}
          {canModify && !editing && (
            <span className="message-actions">
              {message.content && (
                <button type="button" className="btn-link" onClick={() => setEditing(true)}>Edit</button>
              )}
              <button type="button" className="btn-link" onClick={() => onDelete(message._id)}>Delete</button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
