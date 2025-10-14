import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUserNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({
      receiver: req?.user?._id,
    })
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 });
    return res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { notifications },
          "Notifications sent successfully"
        )
      );
  } catch (err) {
    return res.status(500).send({
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
});
export const markNotificationRead = asyncHandler(async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params?._id, { isRead: true });
    return res
      .status(200)
      .send(new ApiResponse(200, true, "Notifications marked as read"));
  } catch (err) {
    return res.status(500).send({
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
});
export const markAllNotificationRead = asyncHandler(async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { receiver: req.user._id, isRead: false }, // correct field name
      { $set: { isRead: true } } // use $set
    );

    res.status(200).send(200, {}, "All marked as read");
  } catch (err) {
    console.log(err);
  }
});
export const removeNotifications = asyncHandler(async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params?._id);
    return res
      .status(200)
      .send(new ApiResponse(200, {}, "Notifications deleted  successfully"));
  } catch (err) {
    return res.status(500).send({
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
});
