import { Chat } from "../models/chat.model.js";
import { Notification } from "../models/notification.model.js";
import { getUserSocketId } from "./onlineUsers.js";
import { client as redisClient } from "../db/redisClient.js";

export const registerSocketHandlers = (io, socket, pubClient) => {
  // socket.user populated by middleware (id, username)
  if (!socket.user) return;
  socket.on("room:join", async ({ roomId }) => {
    try {
      socket.join(roomId);
      const current = await redisClient.get(`room:users:${roomId}`);
      const userCount = current ? parseInt(current) + 1 : 1;

      // Save new count and auto-expire after 10 mins
      await redisClient.set(`room:users:${roomId}`, userCount);
      await redisClient.expire(`video:state:${roomId}`, 600);

      // optionally add socket.id to a room map or DB
      // notify others

      socket.to(roomId).emit("room:user-joined", { user: socket.user });
      // send recent messages to the joining user only
      const recent = await Chat.find({ roomId })
        .sort({ createdAt: 1 })
        .limit(100)
        .populate("sender", "username avatar");
      socket.emit("chat:history", recent);

      const videoState = await redisClient.get(`video:state:${roomId}`);
      if (videoState) {
        socket.emit("video:state", JSON.parse(videoState));
      }
    } catch (err) {
      socket.emit("error", { message: "Failed to join room" });
    }
  });
  socket.on("room:leave", async ({ roomId }) => {
    try {
      socket.leave(roomId);
      const current = await redisClient.get(`room:users:${roomId}`);
      const userCount = Math.max(current ? parseInt(current) - 1 : 0, 0);

      await redisClient.set(`room:users:${roomId}`, userCount, { EX: 600 });

      io.to(roomId).emit("room:user-count", { count: userCount });
      socket.to(roomId).emit("room:user-leave", { user: socket.user });
      if (userCount === 0) {
        await redisClient.del(`room:users:${roomId}`);
        await redisClient.del(`video:state:${roomId}`);
        await redisClient.del(`chat:${roomId}`);
      }
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
      await redisClient.lPush(`chat:${roomId}`, JSON.stringify(populated));
      await redisClient.lTrim(`chat:${roomId}`, 0, 99); // keep last 100

      await redisClient.expire(`chat:${roomId}`, 3600); // 1 hour
      // publish to Redis channel
      await pubClient.publish(
        "chat_message",
        JSON.stringify({ roomId, chat: populated })
      );

      io.to(roomId).emit("chat:receive", populated);
    } catch (err) {
      socket.emit("error", { error: "Message Failed" });
    }
  });
  // subClient.subscribe("chat_message", (msg) => {
  //   const { roomId, chat } = JSON.parse(msg);
  //   io.to(roomId).emit("chat:receive", chat);
  // });

  socket.on("chat:typing", async ({ roomId }) => {
    try {
      socket.to(roomId).emit("chat:typing", { user: socket.user });
    } catch (err) {
      socket.emit("error", { message: "Typing indicator failed" });
    }
  });
  socket.on("video:control", async ({ roomId, action, currentTime }) => {
    try {
      if (!["play", "pause", "seek"].includes(action)) return;

      //broadcast to everyone except sender to avoid double handling
      const state = {
        roomId,
        action,
        currentTime,
        by: socket.user.username,
        updatedAt: Date.now(),
      };
      await redisClient.set(`video:state:${roomId}`, JSON.stringify(state));
      await redisClient.expire(`video:state:${roomId}`, 600);

      // Publish to Redis so all backend servers get this event
      await pubClient.publish("video_control", JSON.stringify(state));
      socket.to(roomId).emit("video:control", {
        action,
        currentTime,
        by: socket.user.username,
      });
    } catch (err) {
      console.log(err);
    }
  });
  // subClient.subscribe("video_control", (message) => {
  //   const data = JSON.parse(message);
  //   const { roomId, action, currentTime, by } = data;
  //   io.to(roomId).emit("video:control", { action, currentTime, by });
  // });

  socket.on("request:state", async (roomId) => {
    const state = await redisClient.get(`video:state:${roomId}`);
    if (state) {
      socket.emit("video:state", JSON.parse(state));
    }
  });

  socket.on(
    "notification:friend-request",
    async ({ receiverId, notification }) => {
      const formattedNotification = {
        _id: notification._id,
        sender: {
          _id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
        },
        receiver: receiverId,
        friendRequestId: notification.friendRequestId,
        type: "friend_request",
        message: `${socket.user.username} sent you a friend request`,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      io.to(receiverId.toString()).emit(
        "notification:new",
        formattedNotification
      );
    }
  );

  socket.on("notification:send", async ({ receiverId, notification }) => {
    const formattedNotification = {
      _id: notification._id,
      sender: {
        _id: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar,
      },
      receiver: receiverId,
      friendRequestId: notification.friendRequestId,
      type: "friend_request",
      message: `${socket.user.username} sent you a friend request`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    io.to(receiverId.toString()).emit(
      "notification:new",
      formattedNotification
    );
  });
  socket.on("request:accepted", async ({ senderId, message }) => {
    try {
      const receiverSockets = getUserSocketId(senderId);
      console.log("receiverSockets is ", receiverSockets);

      if (receiverSockets.size > 0) {
        // Emit to all active sockets (even if just one)
        for (const socketId of receiverSockets) {
          console.log(socketId);

          io.to(socketId).emit("notification:friend-request-accepted", {
            message,
            sender: socket.user,
          });
        }
        console.log(`✅ Friend acceptance sent to ${senderId}`);
      } else {
        console.log(`⚠️ User ${senderId} offline`);
      }

      // persist notification in DB
      await Notification.create({
        sender: socket.user._id,
        receiver: senderId,
        type: "friend_accepted",
        message: `${socket.user.username} accepted your friend request`,
        isRead: false,
      });
    } catch (err) {
      console.error("❌ Error handling request:accepted:", err);
    }
  });
};
