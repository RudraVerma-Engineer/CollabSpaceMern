import "dotenv/config";

import { io } from "socket.io-client";

const TOKEN = process.env.RITIK_TOKEN;
const conversationId = process.env.CONVERSATION_ID;

if (!TOKEN) {
  console.error("❌ RITIK_TOKEN is missing in .env");
  process.exit(1);
}

const socket = io("http://localhost:5000", {
  auth: {
    token: TOKEN,
  },

  forceNew: true,

  transport: ["polling"],
});

console.log("🚀 Starting Ritik socket client...");

//connection
socket.on("connect", () => {
  console.log("==========================");
  console.log("🟢 RITIK CONNECTED");
  console.log("Socket ID:", socket.id);
  console.log("==========================");

  console.log("🗺️ Ritik joining conversation...");

  socket.emit(
    "conversation:join",
    {
      conversationId,
    },
    (response) => {
      console.log("==================");
      console.log("✅ RITIK JOIN ACK");
      console.log(response);
      console.log("===================");
    },
  );
});

//conversation joined

socket.on("conversation:joined", (data) => {
  console.log("💬 Ritik joined:");
  console.log(data);
});

// new message

socket.on("message:new", (message) => {
  console.log("=============================");
  console.log("📰 RITIK RECEIVED NEW MESSAGE");
  console.log("==============================");

  console.log("Meeting ID:", message._id);
  console.log("Content:", message.content);

  if (message.sender) {
    console.log("Sender:", message.sender.name);
  }

  console.log("============================");
});

//error

socket.on("connect_error", (error) => {
  console.error("❌ RITIK CONNECT ERROR:");
  console.error(error.message);
});

// disconnect

socket.on("disconnect", (reason) => {
  console.log("🔴 RITIK DISCONNECTED:");
  console.log(reason);
});
