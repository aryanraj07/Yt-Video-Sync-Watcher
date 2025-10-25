import { Notification } from "../models/notification.model.js";
import { Room } from "../models/room.model.js";
import { User } from "../models/user.model.js";
import { getIo } from "../socket/socket.js";
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
    const userId = req.user._id;
    const rooms = await Room.find({
      $or: [{ host: userId }, { members: userId }],
    }).populate("host members", "fullName email avatar");

    // const rooms = await Room.find().populate("host members", "name email");
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
// controllers/roomController.js
export const inviteToRoom = asyncHandler(async (req, res) => {
  try {
    const { roomId } = req.params;

    const { friendId } = req.body;

    const room = await Room.findById(roomId);

    if (!room) throw new ApiError(404, "Room not found");

    const friend = await User.findById(friendId);

    if (!friend) throw new ApiError(404, "Friend not found");

    // Save notification or emit socket event
    const notification = await Notification.create({
      sender: req.user._id,
      receiver: friendId,
      type: "room_invite",
      message: `${req.user?.username} invited you to join room "${room.name}"`,
      roomId,
    });
    const formattedNotification = {
      _id: notification._id,
      sender: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar,
      },
      receiver: friendId,
      type: "room_invite",
      message: notification.message,
      isRead: notification.isRead,
      roomId, // ✅ include roomId here
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
    const io = getIo();

    io.to(friendId.toString()).emit("notification:new", formattedNotification);
    return res
      .status(200)
      .json(new ApiResponse(200, { notification }, "Invite sent"));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
