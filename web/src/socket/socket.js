import { io } from "socket.io-client";

import { SOCKET_URL } from "../config/env.js";

// One shared connection for the whole app. It is opened after login
// (see AuthProvider) and closed on logout.
export const socket = io(SOCKET_URL, { autoConnect: false });

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
});

export const connectSocket = (token) => {
  if (!token) return;

  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  socket.disconnect();
};

/**
 * Promise wrapper around the server's acknowledgement contract:
 *   ack({ success: true, ... })  -> resolves with the ack
 *   ack({ success: false, message }) -> rejects with an Error(message)
 */
export const emitWithAck = (event, payload) =>
  new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error("You are offline. Reconnecting…"));
      return;
    }

    socket.timeout(8000).emit(event, payload, (timeoutError, response) => {
      if (timeoutError) return reject(new Error("The server did not respond in time."));
      if (!response?.success) return reject(new Error(response?.message || "Request failed"));
      resolve(response);
    });
  });
