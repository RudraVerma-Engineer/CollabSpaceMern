import { useEffect, useRef, useState } from "react";

import { uploadFile } from "../../services/upload.service.js";
import { getErrorMessage } from "../../utils/errors.js";
import { ALLOWED_FILE_ACCEPT } from "../../utils/constants.js";

/** Text box + attach button + send. Calls `onTyping` while the person types. */
const MessageInput = ({ conversationId, onSend, onTyping, disabled }) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  // Focus the box whenever another conversation is opened.
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const canSend = (content.trim() || attachments.length > 0) && !uploading;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSend) return;

    onSend(content, attachments);
    setContent("");
    setAttachments([]);
    inputRef.current?.focus();
  };

  const handleFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const uploaded = await uploadFile(file);
      setAttachments((current) => [...current, uploaded].slice(0, 5));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      {(attachments.length > 0 || uploading || error) && (
        <div className="attachment-bar">
          {attachments.map((file) => (
            <span key={file.url} className="chip">
              📎 {file.name}{" "}
              <button type="button" className="chip-remove" aria-label={`Remove ${file.name}`}
                onClick={() => setAttachments((list) => list.filter((item) => item.url !== file.url))}>
                ×
              </button>
            </span>
          ))}
          {uploading && <span className="muted">Uploading…</span>}
          {error && <span className="attachment-error">{error}</span>}
        </div>
      )}

      <div className="message-input-row">
        <input ref={fileRef} type="file" hidden accept={ALLOWED_FILE_ACCEPT} onChange={handleFile} />
        <button type="button" className="btn" aria-label="Attach a file" disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}>
          📎
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message…"
          aria-label="Message"
          value={content}
          onChange={(event) => { setContent(event.target.value); onTyping(); }}
          maxLength={5000}
          disabled={disabled}
        />
        <button type="submit" className="btn btn-primary" disabled={disabled || !canSend}>
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
