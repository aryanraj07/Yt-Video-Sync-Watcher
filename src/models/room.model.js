import mongoose from "mongoose";
const roomSchema = new mongoose.Schema(
  {
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    videoUrl: {
      type: String,
      requierd: true,
    },
    videoState: {
      isPlaying: { type: Boolean, default: true },
      timeStamp: { type: Number, default: 0 },
    },
    participants: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    password: {
      type: String,
      required: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    videoQueue: [
  {
    url: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
],
  },

  { timestamps: true }
);
export const Room = mongoose.model("Room", roomSchema);
