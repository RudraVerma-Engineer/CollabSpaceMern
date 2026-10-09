import api from "./api.js";

export const getPosts = async (params) => (await api.get("/posts", { params })).data;

export const createPost = async (post) => (await api.post("/posts", post)).data;

export const deletePost = async (postId) => (await api.delete(`/posts/${postId}`)).data;

export const likePost = async (postId) => (await api.post(`/posts/${postId}/like`)).data;

export const savePost = async (postId) => (await api.post(`/posts/${postId}/save`)).data;

export const getComments = async (postId, params) =>
  (await api.get(`/posts/${postId}/comments`, { params })).data;

export const addComment = async (postId, content) =>
  (await api.post(`/posts/${postId}/comments`, { content })).data;

export const deleteComment = async (postId, commentId) =>
  (await api.delete(`/posts/${postId}/comments/${commentId}`)).data;
