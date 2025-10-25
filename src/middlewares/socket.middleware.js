// socket.js
import jwt from "jsonwebtoken";
import cookie from "cookie-parser";
import { registerSocketHandlers } from "../socket/syncHandlers.js";
import { User } from "../models/user.model.js";
import { addOnlineUser, removeOnlineUser } from "../socket/onlineUsers.js";
import { setIo } from "../socket/socket.js";

export const initSocket = (io, pubClient, subClient) => {
  setIo(io);
  // Redis subscriptions for Pub/Sub
  // const setupRedisSubscriptions = async () => {
  //   await subClient.subscribe("chat_message", (msg) => {
  //     const { roomId, chat } = JSON.parse(msg);
  //     io.to(roomId).emit("chat:receive", chat);
  //   });
  //   await subClient.subscribe("video_control", (msg) => {
  //     if (!msg) return; // ignore empty messages
  //     let parsed;
  //     try {
  //       parsed = JSON.parse(msg);
  //     } catch (err) {
  //       console.error("Invalid JSON from Redis:", msg);
  //       return;
  //     }
  //     const { roomId, action, currentTime, by } = parsed;
  //     io.to(roomId).emit("video:control", {
  //       action,
  //       currentTime,
  //       by,
  //       socketId: socket.id,
  //     });
  //   });

  //   console.log("✅ Redis Pub/Sub subscriptions initialized");
  // };
  // setupRedisSubscriptions().catch(console.error);
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

    socket.on("chat-message", (msg) => {
      console.log(`Message from user ${socket.id} is ${msg}`);

      io.emit("chat-message", { user: socket.user.username, msg });
    });

    socket.on("disconnect", () => {
      removeOnlineUser(socket.user._id);
      console.log("❌ User disconnected:", socket.user.username);
    });
  });
};
