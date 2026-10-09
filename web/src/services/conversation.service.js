import api from "./api.js";

export const getConversations = async () => (await api.get("/conversations")).data;

export const createDirectConversation = async (participantId) =>
  (await api.post("/conversations/direct", { participantId })).data;

export const createGroupConversation = async ({ name, participantIds }) =>
  (await api.post("/conversations/group", { name, participantIds })).data;

export const getProjectConversation = async (projectId) =>
  (await api.get(`/conversations/project/${projectId}`)).data;
