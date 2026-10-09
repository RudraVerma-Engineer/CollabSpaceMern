import api from "./api.js";

export const register = async ({ name, email, password }) =>
  (await api.post("/auth/register", { name, email, password })).data;

export const login = async ({ email, password }) =>
  (await api.post("/auth/login", { email, password })).data;

export const logout = async () => (await api.post("/auth/logout")).data;

export const getCurrentUser = async () => (await api.get("/users/me")).data;
