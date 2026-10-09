import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../services/auth.service.js";
import { UNAUTHORIZED_EVENT } from "../services/api.js";
import { connectSocket, disconnectSocket } from "../socket/socket.js";
import { getToken, removeToken, setToken } from "../utils/storage.js";

import AuthContext from "./AuthContext.jsx";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // True right after sign-up, so new users land on their profile first.
  const [justRegistered, setJustRegistered] = useState(false);

  /** Stores the session returned by login / register and opens the socket. */
  const startSession = useCallback((response) => {
    const { token, user: sessionUser } = response.data;

    setToken(token);
    setUser(sessionUser);
    connectSocket(token);

    return response;
  }, []);

  const endSession = useCallback(() => {
    disconnectSocket();
    removeToken();
    setUser(null);
    setJustRegistered(false);
  }, []);

  const login = useCallback(
    async (credentials) => startSession(await loginRequest(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (userData) => {
      const response = startSession(await registerRequest(userData));
      setJustRegistered(true);
      return response;
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Logging out must always succeed locally, even if the request fails.
    }
    endSession();
  }, [endSession]);

  // Restore the session on page load.
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();

        setUser(response.data.user);
        connectSocket(token);
      } catch (error) {
        console.error("Session restore failed:", error);
        endSession();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [endSession]);

  // The API client raises this when a protected request returns 401.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, endSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, endSession);
  }, [endSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      justRegistered,
      login,
      register,
      logout,
      updateUser: setUser, // after profile edits
    }),
    [user, loading, justRegistered, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
