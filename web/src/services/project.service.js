import api from "./api.js";

export const getProjects = async (params) => (await api.get("/projects", { params })).data;

/** Projects I own or have joined. */
export const getMyProjects = async (params) =>
  (await api.get("/projects/mine", { params })).data;

export const getProject = async (projectId) => (await api.get(`/projects/${projectId}`)).data;

export const createProject = async (project) => (await api.post("/projects", project)).data;

export const updateProject = async (projectId, updates) =>
  (await api.patch(`/projects/${projectId}`, updates)).data;

export const deleteProject = async (projectId) =>
  (await api.delete(`/projects/${projectId}`)).data;

export const removeProjectMember = async (projectId, userId) =>
  (await api.delete(`/projects/${projectId}/members/${userId}`)).data;
