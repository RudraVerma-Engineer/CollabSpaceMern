import { useState } from "react";

import {
  createDirectConversation,
  createGroupConversation,
} from "../../services/conversation.service.js";
import { searchUsers } from "../../services/user.service.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { useFetch } from "../../hooks/useFetch.js";
import { getErrorMessage } from "../../utils/errors.js";
import Avatar from "../common/Avatar.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";
import Modal from "../common/Modal.jsx";

/** Start a direct chat, or create a group with several people. */
const NewConversationModal = ({ onClose, onStarted }) => {
  const [mode, setMode] = useState("direct"); // "direct" | "group"
  const [query, setQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState([]); // users picked for the group
  const [error, setError] = useState("");
  const debouncedQuery = useDebouncedValue(query);

  const { data, loading } = useFetch(
    () => searchUsers({ q: debouncedQuery, limit: 20 }),
    [debouncedQuery],
  );

  const run = async (action) => {
    setError("");
    try {
      const response = await action();
      await onStarted(response.data.conversation);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleSelected = (user) =>
    setSelected((current) =>
      current.some((item) => item._id === user._id)
        ? current.filter((item) => item._id !== user._id)
        : [...current, user],
    );

  const handlePick = (user) =>
    mode === "direct" ? run(() => createDirectConversation(user._id)) : toggleSelected(user);

  const canCreateGroup = groupName.trim().length >= 2 && selected.length >= 1;

  return (
    <Modal title="New conversation" onClose={onClose}>
      <div className="tabs" role="tablist">
        {[["direct", "Direct"], ["group", "Group"]].map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={mode === value}
            className={`tab ${mode === value ? "active" : ""}`} onClick={() => setMode(value)}>
            {label}
          </button>
        ))}
      </div>

      {mode === "group" && (
        <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name" aria-label="Group name" maxLength={100} style={{ marginBottom: 10 }} />
      )}

      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name, college or skill" aria-label="Search people" autoFocus />

      <ErrorMessage message={error} />

      <div className="user-pick-list">
        {loading && !data && <p className="empty-state">Searching…</p>}
        {data?.users.length === 0 && <p className="empty-state">No one found.</p>}

        {data?.users.map((user) => {
          const isSelected = selected.some((item) => item._id === user._id);

          return (
            <button key={user._id} type="button" className={`user-pick ${isSelected ? "selected" : ""}`}
              onClick={() => handlePick(user)} aria-pressed={mode === "group" ? isSelected : undefined}>
              <Avatar user={user} size={34} showPresence />
              <span>
                <strong>{user.name}</strong>
                {user.college && <span className="muted"> · {user.college}</span>}
              </span>
              {mode === "group" && isSelected && <span className="badge badge-good" style={{ marginLeft: "auto" }}>Added</span>}
            </button>
          );
        })}
      </div>

      {mode === "group" && (
        <div className="form-actions">
          <span className="muted" style={{ marginRight: "auto" }}>{selected.length} selected</span>
          <button type="button" className="btn btn-primary" disabled={!canCreateGroup}
            onClick={() => run(() => createGroupConversation({
              name: groupName.trim(),
              participantIds: selected.map((user) => user._id),
            }))}>
            Create group
          </button>
        </div>
      )}
    </Modal>
  );
};

export default NewConversationModal;
