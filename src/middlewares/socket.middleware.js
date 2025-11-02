// socket.js
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { registerSocketHandlers } from "../socket/syncHandlers.js";
import { User } from "../models/user.model.js";
import { addOnlineUser, removeOnlineUser } from "../socket/onlineUsers.js";
import { setIo } from "../socket/socket.js";

export const initSocket = (io, pubClient, subClient) => {
  setIo(io);
  subClient.on("message", (channel, message) => {
    if (!message) return;
    try {
      const data = JSON.parse(message);
      switch (channel) {
        case "chat_message":
          io.to(data.roomId).emit("chat:receive", data.chat);
          break;
        case "video_control":
          io.to(data.roomId).emit("video:control", {
            action: data.action,
            currentTime: data.currentTime,
            by: data.by,
          });
          break;
        default:
          console.log("📡 Unknown Redis channel:", channel);
      }
    } catch (err) {
      console.error("Invalid Redis message:", err);
    }
  });

  subClient.subscribe("user:online", (msg) => {
    if (!msg) return;
    try {
      const { userId } = JSON.parse(msg);
      console.log("🟢 Another instance reports online user:", userId);
    } catch (err) {
      console.error("Invalid JSON in user:online message:", msg);
    }
  });

  subClient.subscribe("user:offline", (msg) => {
    if (!msg) return;
    try {
      const { userId } = JSON.parse(msg);
      console.log("🔴 Another instance reports offline user:", userId);
    } catch (err) {
      console.error("Invalid JSON in user:offline message:", msg);
    }
  });

  io.use(async (socket, next) => {
    try {
      // Extract cookies from the socket handshake headers
      // const token = socket.handshake.auth.token || "";
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies.accessToken;

      // Read access token

      if (!token) {
        return next(new Error("Authentication error: No token"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
      const user = await User.findById(decoded._id).select(
        "_id username fullName email avatar"
      );
      if (!user) return next(new Error("User not found"));
      socket.user = user; // attach user info to socket
      console.log("Socket user detals decoded is ", socket.user);

      socket.join(user._id.toString()); //join personal room using id
      console.log("✅ Socket authenticated:", socket.user);
      next();
    } catch (err) {
      console.error("Socket auth failed:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      "🧩 New socket connected:",
      socket.id,
      "User:",
      socket.user?._id
    );
    if (socket.user?._id) {
      addOnlineUser(socket.user._id, socket.id);
    } else {
      console.log("⚠️ No user found on socket, cannot add to onlineUsers");
    }
    registerSocketHandlers(io, socket, pubClient, subClient);

    socket.on("disconnect", () => {
      removeOnlineUser(socket.user._id);
      console.log("❌ User disconnected:", socket.user.username);
    });
  });
};
