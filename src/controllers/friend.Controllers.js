import { Notification } from "../models/notification.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addFriendController = asyncHandler(async (req, res) => {
  //req.body username
  //find username in database
  //friend filed in user and save there
  //check if user is already your friend
  try {
    const { username } = req.body;

    const userId = req.user?._id;
    const user = await User.findById(userId);
    if (!username) {
      throw new ApiError(400, "Username is required");
    }

    const friendUser = await User.findOne({ username });
    if (!friendUser) {
      throw new ApiError(404, "Friend not found");
    }

    if (friendUser?._id.equals(userId)) {
      throw new ApiError(400, "You cannot add yourself as your friend");
    }
    if (user.friends.includes(friendUser?.id)) {
      throw new ApiError(400, "User is already your friend");
    }
    user.friends.push(friendUser?._id);

    friendUser.friends.push(user?._id);
    await user.save({ validateBeforeSave: false });
    await friendUser.save({ validateBeforeSave: false });
    return res.status(201).send(
      new ApiResponse(
        201,
        {
          user: {
            _id: user._id,
            username: user.username,
            friends: user.friends,
          },
          friend: {
            _id: friendUser._id,
            username: friendUser.username,
            friends: friendUser.friends,
          },
        },
        `${friendUser.username} has been added as a friend`
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
//get a single freind
export const getSingleFriend = asyncHandler(async (req, res) => {
  //first extract the username from req.body
  // get the user from req.id
  //or check from the list of freinds in his list
  //return his details
  //will this act as a search for people by username too or will i need to crete different functionality and why even i am creting a get single friend to extract the chat?
  try {
    const { username } = req.params;
    if (!username) {
      throw new ApiError(404, "Username not found");
    }
    const user = await User.find({ username }).populate(
      "friends",
      "username avatar email"
    );
    const friend = await User.find({ username }).select(
      "username email password"
    );
    if (!friend) throw new ApiError(404, "friend not found");

    if (user.blockedUsers.includes(friend?._id))
      throw new ApiError(403, "This user is blocked");
    const isFriend = user.friends.some((f) => f._id.equals(friend._id));
    if (!isFriend) {
      throw new ApiError(403, "This user is not your friend");
    }
    return res.status(200).send(200, friend, "Friend fetched succesfully");
  } catch (err) {}
});
export const getAllfreinds = asyncHandler(async (req, res) => {
  //first extract the user from req.user
  // get the freinds lists he has
  //return the freind list as a response of all the friends
  try {
    const user = await User.findById(req.user?._id)
      .populate({
        path: "friends",
        select: "username avatar email",
      })
      .populate("blockedUsers", "_id");
    if (!user) throw new ApiError(404, "User not found");
    const blockedIds = user.blockedUsers.map((u) => u._id.toString());
    const visibleFriends = user.friends.filter(
      (f) => !blockedIds.includes(f._id.toString())
    );
    //match → filters which documents appear in the populated array.
    // $nin: not in
    return res
      .status(200)
      .send(
        new ApiResponse(200, visibleFriends, "Friends fetched successfully")
      );
  } catch (err) {
    return res.status(500).send({
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
});
export const removeFriends = asyncHandler(async (req, res) => {
  //get the username from req.body
  // find the freind user from username
  // filter out the friend from his friends list
  // filter out the user from friends freind list

  //first extract the user from req.user
  // get the freinds lists he has
  //return the freind list as a response of all the friends
  try {
    const { username } = req.params;
    if (!username) {
      throw new ApiError(404, "Username is required");
    }
    const friendUser = await User.find({ username });
    if (!friendUser) throw new ApiError(404, "Friend not found");

    await Promise.all([
      User.findByIdAndUpdate(req?.user?._id),
      { $pull: { friends: friendUser?._id } },
      User.findByIdAndUpdate(req?.friendUser?._id),
      { $pull: { friends: req.user?._id } },
    ]);
    return res.status(200).send(
      new ApiResponse(
        200,
        {
          user: {
            _id: user?._id,
            username: user?.username,
            friends: user?.friends,
          },
          removedFriend: {
            _id: friendUser?._id,
            username: friendUser?.username,
          },
        },
        `${friendUser.username} has been removed from your friends`
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
const blockUser = asyncHandler(async (req, res) => {
  try {
    //username find the username from the backend
    // get the user and the person to block
    // user.blockList.push id
    const users = await User.find({
      $or: [{ id: req.user?._id }, { username }],
    });
    const user = users.find((u) => u.id === req?._id);
    const targetUser = users.find((u) => u.username === username);
    if (!targetUser) {
      throw new ApiError(400, "User to block is not there");
    }
    if (user.blockedList.includes(targetUser?._id)) {
      throw new ApiError(400, "User is already blocked");
    }
    user.blockedList.push(targetUser._id);
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { blockedUser: targetUser.username },
          `${targetUser.username} has been blocked`
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
export const unBlockUser = asyncHandler(async (req, res) => {
  try {
    //username find the username from the backend
    // get the user and the person to block
    // user.blockList.push id
    const username = req.body;
    if (!username) throw new ApiError(400, "Username is required");
    const user = await User.findById(req.user?._id).populate(
      "blockedUsers",
      "username"
    );

    const targetUser = user.blockedUsers.find((u) => u.username === username);
    if (!targetUser) {
      throw new ApiError(400, "User to block is not there");
    }
    user.blockedUsers = user.blockedUsers.filter(
      (f) => !f.equals(targetUser._id)
    );
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { unBlockUser: targetUser.username },
          `${targetUser.username} has been unblocked`
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
export const sendFriendRequestController = asyncHandler(async (req, res) => {
  try {
    //extract   username from the body and if not present throw error
    // find the user and the targetted user
    //filter the user and the targetted user
    // check if the targetedUser exist or not and throw error
    // now check if the targeted user is already the freind of the user if yes just return with message alredy a freind
    //check if the request is already pending for that user  then just return already sent request
    // now set the the user.freindRequest the option from  and the user details
    const { username } = req.body;
    if (!username) throw new ApiError(400, "Username not found");
    const users = await User.find({
      $or: [{ _id: req.user?._id }, { username }],
    });
    const user = users.find((u) => u.equals(req.user?.id));
    const targetedUser = users.find((u) => u?.username === username);
    if (!targetedUser) throw new ApiError(404, "Username not found");
    if (targetedUser?._id === req.user?._id)
      throw new ApiError(400, "You cannot send friend request to yourself");
    if (user.friends.includes(targetedUser?._id)) {
      throw new ApiError(400, "User is already your friend");
    }
    if (
      targetedUser.friendRequests.some(
        (r) => r.from.equals(req.user?._id) && r.status === "pending"
      )
    )
      throw new ApiError(400, "Request already sent");
    //check if request already exists
    console.log(user);

    // add friend requests to targeted user

    targetedUser.friendRequests.push({ from: req.user?._id });
    await targetedUser.save({ validateBeforeSave: false });
    const friendRequestId =
      targetedUser.friendRequests[targetedUser.friendRequests.length - 1]._id;
    const notification = await Notification.create({
      sender: req.user?._id,
      receiver: targetedUser?._id,
      type: "friend_request",
      message: `${req.user?.username} sent you freind request`,
      friendRequestId,
    });
    return res
      .status(200)
      .send(
        new ApiResponse(
          200,
          notification,
          `Friend request sent to ${targetedUser.username}`
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

export const respondFriendRequestController = asyncHandler(async (req, res) => {
  try {
    //get the requestid and status from the body and if not throw error
    // get the user from the id
    //const request=check if the requestid exist from the user.friendRequests.id
    //get the sender from the request  by checking from key  if not present throw error
    //if action is accep then
    // check if the sender is already friend and same for the user  if not  then add to friends in both
    // update the sender by saving
    // remove the request
    // save the user
    const { requestId, action } = req.body;
    const user = await User.findById(req.user?._id);
    console.log(requestId);
    console.log("requestId type", typeof requestId);

    const request = user.friendRequests.id(requestId);
    if (!request) {
      throw new ApiError(404, "request does not exist");
    }
    const sender = await User.findById(request.from);
    if (!sender) throw new ApiError(404, "sender does not exist");
    if (action === "accept") {
      if (!user.friends.includes(sender?._id)) user.friends.push(sender?._id);
      if (!sender.friends.includes(user?._id)) sender.friends.push(user?._id);
      await sender.save({ validateBeforeSave: false });
    }
    user.friendRequests.filter((r) => r.id.toString() !== requestId);
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .send(new ApiResponse(200, {}, `Friend request ${action}ed`));
  } catch (err) {
    return res.status(500).send({
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
});
//search user
export const searchUser = asyncHandler(async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      throw new ApiError(404, "Username not found");
    }

    const users = await User.find({
      username: { $regex: username, $options: "i" }, // case-insensitive search
      _id: { $ne: req.user?._id }, // exclude current user
    })
      .select("username avatar email friendRequests")
      .lean();
    const currentUser = await User.findById(req.user._id).lean();
    //lean function return plain js object instead of mongoose document

    const updatedUsers = users.map((u) => {
      const isFriend = currentUser.friends.some(
        (friendId) => friendId.toString() === u._id.toString()
      );

      const requestSent = u.friendRequests?.some(
        (r) =>
          r.from.toString() === currentUser._id.toString() &&
          r.status === "pending"
      );
      ``;
      const requestPendingFromThem = currentUser.friendRequests?.some(
        (r) => r.from.toString() === u._id.toString() && r.status === "pending"
      );
      return {
        ...u,
        isFriend,
        requestSent, // if you sent request to them
        requestPendingFromThem, // if they sent to you
      };
    });
    return res
      .status(200)
      .send(new ApiResponse(200, updatedUsers, "Users fetched successfully"));
  } catch (err) {
    return res.status(500).send({
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  }
});
