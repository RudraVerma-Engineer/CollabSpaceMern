import { useEffect, useRef } from "react";

import LoadingState from "../common/LoadingState.jsx";
import ErrorMessage from "../common/ErrorMessage.jsx";
import { sameId } from "../../utils/conversation.js";
import MessageBubble from "./MessageBubble.jsx";

const MessageList = ({ messages, loading, error, currentUserId, isGroup, onRetry, onDiscard, onEdit, onDelete }) => {
  const endRef = useRef(null);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading) return <div className="message-list"><LoadingState label="Loading messages…" /></div>;

  return (
    <div className="message-list">
      <ErrorMessage message={error} />

      {messages.length === 0 && !error && <p className="empty-state">No messages yet. Say hello 👋</p>}

      {messages.map((message) => {
        const isOwn = sameId(message.sender, currentUserId);
        const seenByOthers = message.readBy?.some((entry) => !sameId(entry.user, currentUserId));

        return (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={isOwn}
            showSender={isGroup && !isOwn}
            seenByOthers={seenByOthers}
            onRetry={onRetry}
            onDiscard={onDiscard}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        );
      })}

      <div ref={endRef} />
    </div>
  );
};

export default MessageList;
