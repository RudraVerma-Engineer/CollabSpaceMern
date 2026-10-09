/**
 * Holds the Socket.IO server instance so that services can emit events
 * without importing the socket handlers (avoids circular imports).
 */
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => ioInstance;
