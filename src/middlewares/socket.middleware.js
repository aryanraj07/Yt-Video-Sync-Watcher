// socket.js
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { registerSocketHandlers } from "../socket/syncHandlers.js";

export const initSocket = (io) => {
  io.use((socket, next) => {
    try {
      // Extract cookies from the socket handshake headers
      const token = socket.handshake.auth.token || "";

      // Read access token

      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
      socket.user = decoded; // attach user info to socket
      next();
    } catch (err) {
      console.error("Socket auth failed:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.user);
    registerSocketHandlers(io, socket);

    socket.on("chat-message", (msg) => {
      console.log(`Message from user ${socket.id} is ${msg}`);

      io.emit("chat-message", { user: socket.user.username, msg });
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.user.username);
    });
  });
};
