// src/socket/onlineUsers.js
import { pubClient } from "../db/redisClient.js";

const onlineUsers = new Map(); // Local cache (userId -> Set(socketIds))

export const addOnlineUser = async (userId, socketId) => {
  const id = userId.toString();

  if (!onlineUsers.has(id)) onlineUsers.set(id, new Set());
  onlineUsers.get(id).add(socketId);

  // Optional: publish for cross-instance sync
  await pubClient.publish(
    "user:online",
    JSON.stringify({ userId: id, socketId })
  );

  console.log(
    "🟢 User connected:",
    id,
    "Sockets:",
    Array.from(onlineUsers.get(id))
  );
};

export const removeOnlineUser = async (userId, socketId) => {
  const id = userId.toString();
  if (!onlineUsers.has(id)) return;

  const sockets = onlineUsers.get(id);
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(id);
    await pubClient.publish("user:offline", JSON.stringify({ userId: id }));
  }

  console.log("🔴 User disconnected:", id);
};

export const getUserSocketId = (userId) => {
  return onlineUsers.get(userId.toString()) || new Set();
};

export const getAllOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
