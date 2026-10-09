import api from "./api.js";

export const searchAll = async (q) => (await api.get("/search", { params: { q, limit: 6 } })).data;
