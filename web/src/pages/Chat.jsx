import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChatWindow from "../components/chat/ChatWindow.jsx";
import ConversationSidebar from "../components/conversations/ConversationSidebar.jsx";
import NewConversationModal from "../components/conversations/NewConversationModal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useConversations } from "../hooks/useConversations.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { useSocketEvent } from "../hooks/useSocketEvent.js";
import { sameId } from "../utils/conversation.js";

/** /messages and /messages/:conversationId */
const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadByConversation, markConversationRead } = useNotifications();
  const { conversations, loading, refresh } = useConversations();

  const [showNewModal, setShowNewModal] = useState(false);

  const selected = conversations.find((item) => sameId(item, conversationId)) || null;

  // Opening a conversation clears its unread badge.
  useEffect(() => {
    if (conversationId) markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  // A message that arrives while its conversation is open is already "seen".
  // Deferred so the notification list has been updated first.
  useSocketEvent("notification:new", (notification) => {
    if (notification.type === "new_message" && notification.data.conversationId === conversationId) {
      setTimeout(() => markConversationRead(conversationId), 0);
    }
  });

  const handleStarted = async (conversation) => {
    await refresh(); // make sure the new conversation is in the list
    setShowNewModal(false);
    navigate(`/messages/${conversation._id}`);
  };

  return (
    <div className={`chat-layout ${conversationId ? "has-selection" : ""}`}>
      <ConversationSidebar
        conversations={conversations}
        loading={loading}
        selectedId={conversationId}
        currentUser={user}
        unreadByConversation={unreadByConversation}
        onNewConversation={() => setShowNewModal(true)}
      />

      <ChatWindow key={conversationId} conversation={selected} currentUser={user} />

      {showNewModal && (
        <NewConversationModal onClose={() => setShowNewModal(false)} onStarted={handleStarted} />
      )}
    </div>
  );
};

export default Chat;
