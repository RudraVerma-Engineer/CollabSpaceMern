export const getOtherParticipant = (conversation, currentUserId) =>
  conversation.participants?.find(
    (participant) => participant._id?.toString() !== currentUserId?.toString(),
  );

export const getConversationName = (conversation, currentUserId) => {
  if (conversation.type === "direct") {
    return getOtherParticipant(conversation, currentUserId)?.name || "Unknown user";
  }

  if (conversation.type === "project") {
    return conversation.name || conversation.project?.title || "Project chat";
  }

  return conversation.name || "Unnamed group";
};

export const getConversationLabel = (conversation) =>
  ({ direct: "Direct", group: "Group", project: "Team chat" })[conversation.type] ||
  "Conversation";

export const sameId = (a, b) => (a?._id ?? a)?.toString() === (b?._id ?? b)?.toString();
