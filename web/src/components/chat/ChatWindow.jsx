import { Link } from "react-router-dom";

import { useChat } from "../../hooks/useChat.js";
import { socket } from "../../socket/socket.js";
import { useSocketEvent } from "../../hooks/useSocketEvent.js";
import { getConversationName, getOtherParticipant, sameId } from "../../utils/conversation.js";
import { useState } from "react";
import Avatar from "../common/Avatar.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageList from "./MessageList.jsx";

const ChatWindow = ({ conversation, currentUser }) => {
  const chat = useChat(conversation?._id, currentUser);

  // Show a banner while the socket is down so sending failures make sense.
  const [connected, setConnected] = useState(socket.connected);
  useSocketEvent("connect", () => setConnected(true));
  useSocketEvent("disconnect", () => setConnected(false));

  if (!conversation) {
    return (
      <section className="chat-window empty-chat">
        <h2>Your conversations</h2>
        <p>Select a conversation, or start a new one with the + button.</p>
      </section>
    );
  }

  const isDirect = conversation.type === "direct";
  const other = isDirect ? getOtherParticipant(conversation, currentUser._id) : null;
  const name = getConversationName(conversation, currentUser._id);

  const typingNames = chat.typingUserIds
    .map((id) => conversation.participants.find((p) => sameId(p, id))?.name)
    .filter(Boolean);

  const subtitle = isDirect
    ? other?.isOnline ? "Online" : "Offline"
    : `${conversation.participants.length} members`;

  return (
    <section className="chat-window">
      <header className="chat-header">
        <Link to="/messages" className="btn btn-sm chat-back" aria-label="Back to conversations">←</Link>
        {isDirect && <Avatar user={other} showPresence />}

        <div>
          <h2>{name}</h2>
          <span className="chat-header-sub">{subtitle}</span>
        </div>

        {conversation.project && (
          <Link to={`/projects/${conversation.project._id}`} className="btn btn-sm" style={{ marginLeft: "auto" }}>
            View project
          </Link>
        )}
      </header>

      {!connected && <div className="chat-status">Reconnecting… messages will fail until you're back online.</div>}

      <MessageList
        messages={chat.messages}
        loading={chat.loading}
        error={chat.error}
        currentUserId={currentUser._id}
        isGroup={!isDirect}
        onRetry={chat.retry}
        onDiscard={chat.discard}
        onEdit={chat.edit}
        onDelete={chat.remove}
      />

      <div className="typing-indicator" aria-live="polite">
        {typingNames.length > 0 && `${typingNames.join(", ")} ${typingNames.length > 1 ? "are" : "is"} typing…`}
      </div>

      <MessageInput
        conversationId={conversation._id}
        onSend={chat.send}
        onTyping={chat.notifyTyping}
      />
    </section>
  );
};

export default ChatWindow;
