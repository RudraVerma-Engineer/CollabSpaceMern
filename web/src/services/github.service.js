import api from "./api.js";

export const getRepositoryStats = async (url) =>
  (await api.get("/github/repository", { params: { url } })).data;
