import User from "../models/user.model.js";
import { getContactIds } from "../services/conversation.service.js";
import { getUserRoom } from "./emitters.js";

// userId -> number of open sockets (a user can have several tabs/devices)
const connectionCounts = new Map();

/** Tells everyone who shares a conversation with the user. */
const broadcastPresence = async (io, userId, event, payload) => {
  const contactIds = await getContactIds(userId);

  for (const contactId of contactIds) {
    io.to(getUserRoom(contactId)).emit(event, { userId, ...payload });
  }
};

export const handlePresenceConnect = (io, socket) => {
  const { userId } = socket;
  const count = connectionCounts.get(userId) || 0;

  connectionCounts.set(userId, count + 1);

  // Only the first connection flips the user to "online".
  if (count === 0) {
    User.updateOne({ _id: userId }, { isOnline: true })
      .then(() => broadcastPresence(io, userId, "presence:online"))
      .catch((error) =>
        console.error("❌ Failed to mark user online:", error.message),
      );
  }

  socket.on("disconnect", async () => {
    const remaining = (connectionCounts.get(userId) || 1) - 1;

    if (remaining > 0) {
      connectionCounts.set(userId, remaining);
      return;
    }

    // Last connection closed -> offline.
    connectionCounts.delete(userId);
    const lastSeen = new Date();

    try {
      await User.updateOne({ _id: userId }, { isOnline: false, lastSeen });
      await broadcastPresence(io, userId, "presence:offline", { lastSeen });
    } catch (error) {
      console.error("❌ Failed to update last seen:", error.message);
    }
  });
};
