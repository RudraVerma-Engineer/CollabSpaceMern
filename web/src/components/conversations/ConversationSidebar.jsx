import { Link } from "react-router-dom";

import { getConversationName, getOtherParticipant, sameId } from "../../utils/conversation.js";
import { formatMessageTime } from "../../utils/format.js";
import Avatar from "../common/Avatar.jsx";
import LoadingState from "../common/LoadingState.jsx";

const ConversationSidebar = ({
  conversations,
  loading,
  selectedId,
  currentUser,
  unreadByConversation,
  onNewConversation,
}) => (
  <aside className="conversation-sidebar">
    <div className="conversation-header">
      <h2>Messages</h2>
      <button type="button" className="btn btn-sm" onClick={onNewConversation} aria-label="New conversation">
        + New
      </button>
    </div>

    <div className="conversation-list">
      {loading && <LoadingState />}

      {!loading && conversations.length === 0 && (
        <p className="empty-state">
          No conversations yet. Start one with someone from <Link to="/people">People</Link>.
        </p>
      )}

      {conversations.map((conversation) => {
        const name = getConversationName(conversation, currentUser._id);
        const unread = unreadByConversation[conversation._id] || 0;
        const other = conversation.type === "direct" ? getOtherParticipant(conversation, currentUser._id) : null;
        const last = conversation.lastMessage;
        const lastText = last
          ? `${sameId(last.sender, currentUser._id) ? "You: " : ""}${last.content || "📎 Attachment"}`
          : "No messages yet";

        return (
          <Link
            key={conversation._id}
            to={`/messages/${conversation._id}`}
            className={`conversation-item ${sameId(conversation, selectedId) ? "active" : ""} ${unread ? "unread" : ""}`}
          >
            <Avatar user={other || { name }} showPresence={Boolean(other)} />

            <div className="conversation-info">
              <strong>{name}</strong>
              <span>
                {conversation.type === "project" && <span className="conversation-type-tag">TEAM</span>}
                {lastText}
              </span>
            </div>

            {unread > 0 ? (
              <span className="conversation-unread">{unread}</span>
            ) : (
              last && <span className="muted">{formatMessageTime(last.createdAt)}</span>
            )}
          </Link>
        );
      })}
    </div>
  </aside>
);

export default ConversationSidebar;
