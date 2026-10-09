import api from "./api.js";

export const getMessages = async (conversationId, page = 1, limit = 50) =>
  (await api.get(`/messages/${conversationId}`, { params: { page, limit } })).data;

/** REST fallback; the chat UI normally sends messages over the socket. */
export const sendMessage = async (conversationId, content) =>
  (await api.post(`/messages/${conversationId}`, { content })).data;

export const editMessage = async (messageId, content) =>
  (await api.patch(`/messages/message/${messageId}`, { content })).data;

export const deleteMessage = async (messageId) =>
  (await api.delete(`/messages/message/${messageId}`)).data;
