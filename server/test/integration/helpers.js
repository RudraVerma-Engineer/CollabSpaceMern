import { io as createClient } from "socket.io-client";

/**
 * Boots the real app (Express + Socket.IO) on a random port against a test
 * database. Environment variables are set *before* the app modules load.
 */
export const startTestServer = async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";
  process.env.UPLOAD_DIR = process.env.UPLOAD_DIR_TEST || "/tmp/collabspace-test-uploads";
  process.env.MONGO_URI =
    process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/collabspace_test";

  const { default: mongoose } = await import("mongoose");
  const { default: connectDB } = await import("../../src/config/db.js");
  // Importing the server registers every Mongoose model.
  const { createHttpServer } = await import("../../src/http-server.js");

  await connectDB(process.env.MONGO_URI);
  await mongoose.connection.dropDatabase();
  await buildIndexes(mongoose);

  const { httpServer, io } = createHttpServer();
  await new Promise((resolve) => httpServer.listen(0, resolve));

  const baseUrl = `http://127.0.0.1:${httpServer.address().port}`;

  return {
    baseUrl,
    async stop() {
      io.close();
      await new Promise((resolve) => httpServer.close(resolve));
      await mongoose.disconnect();
    },
  };
};

/**
 * Builds the indexes declared on the models. Some MongoDB-compatible engines
 * do not support every index option (e.g. partial indexes); real MongoDB and
 * Atlas do, so an unsupported index is reported but not fatal here.
 */
const buildIndexes = async (mongoose) => {
  for (const model of Object.values(mongoose.models)) {
    try {
      await model.syncIndexes();
    } catch (error) {
      console.warn(`⚠️  ${model.modelName}: ${error.message}`);
    }
  }
};

/** Tiny fetch wrapper: returns { status, body }. */
export const createApi = (baseUrl) => async (method, path, { token, body } = {}) => {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return { status: response.status, body: await response.json() };
};

export const connectSocket = (baseUrl, token) =>
  new Promise((resolve, reject) => {
    const socket = createClient(baseUrl, {
      auth: { token },
      forceNew: true,
      transports: ["websocket"],
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
  });

export const emitWithAck = (socket, event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, resolve));

/** Resolves with the next payload of `event`, or rejects after `timeout` ms. */
export const waitForEvent = (socket, event, predicate = () => true, timeout = 3000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for "${event}"`));
    }, timeout);

    const handler = (payload) => {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };

    socket.on(event, handler);
  });

/** Uploads a small in-memory file through POST /api/uploads. */
export const uploadFile = async (baseUrl, token, { name, type, content }) => {
  const form = new FormData();
  form.append("file", new Blob([content], { type }), name);

  const response = await fetch(`${baseUrl}/api/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  return { status: response.status, body: await response.json() };
};
