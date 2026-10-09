import "dotenv/config";
import { io } from "socket.io-client";

const TOKEN = process.env.SOCKET_TOKEN;
const conversationId = process.env.CONVERSATION_ID;

if (!TOKEN) {
  console.error("❌ SOCKET_TOKEN is missing in .env");
  process.exit(1);
}

if (!conversationId) {
  console.error("❌ CONVERSATION_ID is missing in .env");
  process.exit(1);
}

console.log("🚀 Starting socket client ...");
console.log("Conversation:", conversationId);

const socket = io("http://localhost:5000", {
  auth: {
    token: TOKEN,
  },
  forceNew: true,

  transports: ["polling"],
});

//connection

socket.on("connect", () => {
  console.log("==========================================");
  console.log("🟢 CLIENT CONNECTED");
  console.log("Socket ID:", socket.id);
  console.log("Transport:", socket.io.engine.transport.name);
  console.log("==========================================");

  console.log("Joining conversation...");

  socket.emit(
    "conversation:join",
    {
      conversationId,
    },
    (response) => {
      console.log("=====================");
      console.log("✅ Join ACK");
      console.log(response);
      console.log("========================");

      if (!response?.success) {
        console.error("❌ Failed to join conversation");
        return;
      }

      console.log("🏠 Successfully joined converation");
      console.log("Waiting for message...");
      console.log("===========================");
    },
  );
});

//Conversation Joined

socket.on("conversation:joined", (data) => {
  console.log("💬 conversation:joined");
  console.log(data);
});

// New Message

socket.on("message:new", (message) => {
  console.log("========================");
  console.log("📰 New message received");
  console.log("=========================");

  console.log("Message ID:", message._id);
  console.log("Content: ", message.content);
  console.log("Type:", message.type);

  if (message.sender) {
    console.log("Sender:", message.sender.name);
    console.log("Sender ID:", message.sender._id);
  }

  console.log("=========================");
});

// message read
socket.on("message:read", (data) => {
  console.log("👁️ Message Read", data);
});

//connection error

socket.on("connect_error", (error) => {
  console.error("❌ CONNECT ERROR:");
  console.error(error.message);
});

// disconnect

socket.on("disconnect", (reason) => {
  console.log("🔴 DISCONNECTED:");
  console.log(reason);
});
