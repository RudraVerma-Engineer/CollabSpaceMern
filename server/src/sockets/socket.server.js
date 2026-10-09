import { Server } from "socket.io";

import env from "../config/env.js";
import { registerChatHandlers } from "./chat.socket.js";
import { getUserRoom } from "./emitters.js";
import { setIO } from "./io.registry.js";
import { handlePresenceConnect } from "./presence.socket.js";
import { authenticateSocket } from "./socket.auth.js";

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrls,
      credentials: true,
    },
  });

  setIO(io);

  // Every connection must present a valid JWT.
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    // Personal room: notifications and presence reach every device of a user.
    socket.join(getUserRoom(socket.userId));

    // IMPORTANT: register handlers immediately, before any async work.
    registerChatHandlers(io, socket);
    handlePresenceConnect(io, socket);
  });

  return io;
};
