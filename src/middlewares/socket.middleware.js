// socket.js
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { registerSocketHandlers } from "../socket/syncHandlers.js";
import { User } from "../models/user.model.js";

export const initSocket = (io) => {
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
