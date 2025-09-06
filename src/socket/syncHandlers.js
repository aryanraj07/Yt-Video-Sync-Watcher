import { Chat } from "../models/chat.model.js";

export const registerSocketHandlers = (io, socket) => {
  // socket.user populated by middleware (id, username)
  socket.on("room:join", async ({ roomId }) => {
    try {
      socket.join(roomId);
      // optionally add socket.id to a room map or DB
      // notify others
      socket.to(roomId).emit("room:user-joined", { user: socket.user });
      // send recent messages to the joining user only
      const recent = await Chat.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(100)
        .populate("sender", "username avatar");
      socket.emit("chat:history", recent);
      if (roomVideoState[roomId]) {
        socket.emit("video:state", roomVideoState[roomId]);
      }
    } catch (err) {
      socket.emit("error", { message: "Failed to join room" });
    }
  });
  socket.on("room:leave", ({ roomId }) => {
    try {
      socket.leave(roomId);
      socket.to(roomId).emit("room:user-leave", { user: socket.user });
    } catch (err) {
      socket.emit("error", { message: "Failed to leave room" });
    }
  });
  socket.on("chat:send", async ({ roomId, message }) => {
    try {
      const chat = await Chat.create({
        roomId,
        sender: socket.user._id,
        message,
      });
      console.log(chat);

      const populated = await chat.populate("sender", "username avatar");
      io.to(roomId).emit("chat:receive", populated);
    } catch (err) {
      socket.emit("error", { error: "Message Failed" });
    }
  });
  socket.on("chat:typing", async ({ roomId }) => {
    try {
      socket.to(roomId).emit("chat:typing", { user: socket.user });
    } catch (err) {
      socket.emit("error", { message: "Typing indicator failed" });
    }
  });
  socket.on("video:control", ({ roomId, action, currentTime }) => {
    try {
      if (!["play", "pause", "seek"].includes(action)) return;

      //broadcast to everyone except sender to avoid double handling
      socket.to(roomId).emit("video:control", {
        action,
        currentTime,
        by: socket.user.username,
      });
    } catch (err) {
      console.log(err);
    }
  });
  socket.on("request:state", async (roomId) => {
    // When new user wants current state, host (or anyone) can respond with room state
    // Implement storing of last known state in-memory or DB if you want persistence
    socket.to(roomId).emit("request:state", { by: socket.user._id });
  });
  socket.on("disconnect", () => {
    // Notify all rooms the user was in (except the default socket room)
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        io.to(room).emit("left-room", { user: socket.user });
      }
    }
  });
};
