import { Room } from "../models/room.model.js";
import { generateRoomCode } from "../utils/genereateRoomCode.js";

export const registerSocketHandlers = (io, socket) => {
  socket.on("create_room", async ({ username, videoUrl }) => {
    const roomCode = generateRoomCode();

    const room = await Room.create({});
    socket.join(roomCode);
    io.to(roomCode).emit("room_created", { roomCode });
  });

  socket.on("join_room", async ({ username, roomCode }) => {
    // Validate room exists
    socket.join(roomCode);
    io.to(roomCode).emit("user_joined", { username });
  });

  socket.on("play_video", ({ roomId, timestamp }) => {
    socket.to(roomId).emit("play_video", { timestamp });
  });

  socket.on("pause_video", ({ roomId, timestamp }) => {
    socket.to(roomId).emit("pause_video", { timestamp });
  });

  socket.on("seek_video", ({ roomId, timestamp }) => {
    socket.to(roomId).emit("seek_video", { timestamp });
  });

  socket.on("disconnect", () => {
    // Remove user from DB and notify others
  });
};
