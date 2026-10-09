import http from "http";

import app from "./app.js";
import { initializeSocket } from "./sockets/socket.server.js";

/** Express app + Socket.IO on one HTTP server. Does not call `listen`. */
export const createHttpServer = () => {
  const httpServer = http.createServer(app);
  const io = initializeSocket(httpServer);

  return { httpServer, io };
};
