import { Chat } from "../models/chat.model.js";
import { Room } from "../models/room.model.js";

// ✅ Send message
export const sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const sender = req.user._id;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room)
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });

    const chat = await Chat.create({ roomId, sender, message });

    res.status(201).json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all messages in a room
export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await Chat.find({ roomId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
