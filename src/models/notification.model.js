import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "friend_request",
        "friend_accepted",
        "message",
        "system",
        "room_invite",
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
    },

    friendRequestId: {
      type: mongoose.Schema.Types.ObjectId, // <-- store the ObjectId of friend request subdoc
      ref: "User.friendRequests", // optional, just for clarity
      required: function () {
        return this.type === "friend_request";
      },
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId, // <-- store the ObjectId of friend request subdoc
      ref: "Room", // optional, just for clarity
      required: function () {
        return this.type === "room_invite";
      },
    },
  },
  { timestamps: true }
);
export const Notification = mongoose.model("Notification", NotificationSchema);
