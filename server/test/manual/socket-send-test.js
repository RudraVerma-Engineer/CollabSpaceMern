import "dotenv/config";

import { io } from "socket.io-client";

const TOKEN = process.env.SOCKET_TOKEN;
const conversationId = process.env.CONVERSATION_ID;

const socket = io("http://localhost:5000", {
  auth: {
    token: TOKEN,
  },
  forceNew: true,

  transport: ["polling"],
});

//connect

socket.on("connect", () => {
  console.log("🟢 Rudra sender connected");

  socket.emit(
    "conversation:join",
    {
      conversationId,
    },
    (response) => {
      console.log("🏠 Join response:", response);

      if (!response?.success) {
        socket.disconnect();
        return;
      }
      console.log("🗺️ Sending message...");

      socket.emit(
        "message:send",
        {
          conversationId,
          content: "Hello Ritik! This is a real-time message 🚀",
        },
        (messageResponse) => {
          console.log("📰 Message ACK");
          console.dir(messageResponse, {
            depth: null,
          });

          setTimeout(() => {
            socket.disconnect();
          }, 1000);
        },
      );
    },
  );
});

socket.on("message:new", (message) => {
  console.log("📡 Sender recieved message: new");
  console.log(message.content);
});

socket.on("connect_error", (error) => {
  console.error("❌ Connection error:", error.message);
});
