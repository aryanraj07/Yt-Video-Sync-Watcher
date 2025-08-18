import mongoose from "mongoose";
const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      requierd: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },

  { timestamps: true }
);
export const Room = mongoose.model("Room", roomSchema);
