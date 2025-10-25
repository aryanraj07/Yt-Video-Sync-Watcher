// src/socket/onlineUsers.js

const onlineUsers = new Map(); // userId -> Set of socketIds

export const addOnlineUser = (userId, socketId) => {
  const id = userId.toString();
  if (!onlineUsers.has(id)) onlineUsers.set(id, new Set());
  console.log("🧍 Online users map:", Array.from(onlineUsers.entries()));
  onlineUsers.get(id).add(socketId);
};

export const removeOnlineUser = (userId, socketId) => {
  const id = userId.toString();
  if (onlineUsers.has(id)) {
    onlineUsers.get(id).delete(socketId);
    if (onlineUsers.get(id).size === 0) onlineUsers.delete(id);
  }
};

export const getUserSocketId = (userId) => {
  return onlineUsers.get(userId.toString()) || new Set();
};
export const getAllOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};
