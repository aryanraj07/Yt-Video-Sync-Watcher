import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createRoom = asyncHandler(async (req, res) => {
  try {
    const { name, videoUrl } = req.body;
    const host = req.user?._id;
    const room = await Room.create({
      name,
      videoUrl,
      members: [host],
    });
    res
      .status(200)
      .send(new ApiResponse(200, room, "Room created successfully"));
  } catch (err) {
    // throw new ApiError(500, err.msg);
    return res.status(500).send({
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
});
export const getSingleRoom = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findById(roomId).populate(
      "host members",
      "name email"
    );

    if (!room) {
      throw new ApiError(404, "Room not found");
    }

    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export const getRooms = asyncHandler(async (req, res) => {
  try {
    const rooms = await Room.find().populate("host members", "name email");
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
export const joinARoom = asyncHandler(async (req, res) => {
  try {
    //get roomId from the params
    //get the user
    //if the room id does not exist throw error
    //check if the member exist in the room if not push the member in the participants
    const { roomId } = req.params;
    const userId = req.user?._id;
    const room = await Room.findById(roomId);
    if (!room) {
      throw new ApiError(404, "Invalid room id ");
    }
    if (!room.members.includes(userId)) room.members.push(userId);
    await room.save();

    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
