import "dotenv/config";

import { io } from "socket.io-client";

const TOKEN =process.env.SOCKET_TOKEN;

const conversationId = process.env.CONVERSATION_ID;

console.log("🚀 Starting socket client...");

const socket = io("http://localhost:5000", {
  auth: {
    token: TOKEN,
  },

  forceNew: true,

  transports: ["polling"],
});

// ==========================================
// CONNECTION
// ==========================================

socket.on("connect", () => {
  console.log("========================================");
  console.log("🟢 CLIENT CONNECTED");
  console.log("Socket ID:", socket.id);
  console.log("Connected:", socket.connected);
  console.log("Transport:", socket.io.engine.transport.name);
  console.log("========================================");

  console.log("📤 Joining conversation...");

  socket.emit(
    "conversation:join",
    {
      conversationId,
    },
    (response) => {
      console.log("========================================");
      console.log("✅ JOIN ACK RECEIVED");
      console.log(response);
      console.log("========================================");

      if (!response?.success) {
        console.log("❌ Failed to join conversation");
        return;
      }

      console.log("📤 Sending test message...");

      socket.emit(
        "message:send",
        {
          conversationId,
          content: "Hello from CollabSpace Socket.IO 🚀",
        },
        (messageResponse) => {
          console.log("========================================");
          console.log("📨 MESSAGE ACK RECEIVED");
          console.log(messageResponse);
          console.log("========================================");
        },
      );
    },
  );
});

// ==========================================
// CONVERSATION JOINED
// ==========================================

socket.on("conversation:joined", (data) => {
  console.log("💬 conversation:joined received:");
  console.log(data);
});

// ==========================================
// NEW MESSAGE
// ==========================================

socket.on("message:new", (message) => {
  console.log("========================================");
  console.log("📨 message:new received");
  console.log("========================================");

  console.log("Message ID:", message._id);
  console.log("Conversation:", message.conversation);
  console.log("Content:", message.content);
  console.log("Type:", message.type);
  console.log("Sender:", message.sender);

  console.log("========================================");
});

// ==========================================
// CONNECTION ERROR
// ==========================================

socket.on("connect_error", (error) => {
  console.error("❌ CONNECT ERROR:");
  console.error(error.message);
});

// ==========================================
// DISCONNECT
// ==========================================

socket.on("disconnect", (reason) => {
  console.log("🔴 DISCONNECTED:");
  console.log(reason);
});
