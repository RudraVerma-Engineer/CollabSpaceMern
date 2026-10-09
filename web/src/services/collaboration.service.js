import api from "./api.js";

const BASE = "/collaboration-requests";

export const sendCollaborationRequest = async ({ projectId, message }) =>
  (await api.post(BASE, { projectId, message })).data;

export const getReceivedRequests = async (params) =>
  (await api.get(`${BASE}/received`, { params })).data;

export const getSentRequests = async (params) =>
  (await api.get(`${BASE}/sent`, { params })).data;

export const acceptRequest = async (requestId) =>
  (await api.patch(`${BASE}/${requestId}/accept`)).data;

export const rejectRequest = async (requestId) =>
  (await api.patch(`${BASE}/${requestId}/reject`)).data;

export const cancelRequest = async (requestId) =>
  (await api.delete(`${BASE}/${requestId}`)).data;
