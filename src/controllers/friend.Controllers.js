import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addFriendController = asyncHandler(async (req, res) => {
  //req.body username
  //find username in database
  //friend filed in user and save there
  const { username } = req.body;
  const userId = req.user?._id;
  const getUser = await User.findById(userId);
  if (!getUser)
    if (!username) {
      throw new ApiError(400, "Username is required");
    }

  const friendUser = await User.findOne({ username });
  console.log(freindUser);
  if (!friendUser) {
    throw new ApiError(404, "Friend not found");
  }

  if (friendUser?._id === userId) {
    throw new ApiError(400, "You cannot add yourself as your friend");
  }

  //   console.log(findUser);
});
