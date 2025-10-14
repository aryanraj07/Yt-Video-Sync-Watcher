import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
const options = {
  httpOnly: true,
  secure: true, // true in production
  sameSite: "none",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    //find user
    //with user refrence create access token and refresh token
    //set the refresh token in the database i.e user
    // save in the database and validationfalse for other fields
    //return both
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    console.log("Error while generating token", err);
  }
};
const refreshAccessToken = async (req, res) => {
  //we get the refresh token
  //check if it is present not then throw error
  //dcode the token if not matched throw error
  //find user
  //match the refrsh token
  //if not mached throw error
  //finally generate new token
  //set in the cookies and send response
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) throw new ApiError(401, "Token not found");

  try {
    const decodingToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN
    );

    const user = await User.findById(decodingToken?._id);
    if (!user) {
      throw new ApiError(401, "Token has expired");
    }

    if (user.refreshToken !== incommingRefreshToken)
      throw new ApiError(401, "Token has expired");
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user?._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, {
        ...options,
        maxAge: 10 * 24 * 24 * 60 * 1000,
      })
      .send(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Acess token refreshed"
        )
      );
  } catch (err) {
    return res.status(500).send({
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    // throw new ApiError(500, err?.msg || "Error in refreshing the access token");
  }
};
export const changeCurrentPassword = asyncHandler(async (req, res) => {
  //oldpassword  newPassword confirmPassword
  //new password confirm password  match nhi hua hai to throw error
  // user find kr ke user id and user database se nikalna hai
  // user.isCorrectPassword kr ke
  // user.password=newpassword kr dena hai
  //user
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user?._id;

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, " New password and confirm password did not match");
  }
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(400, "User not found");
  }
  const checkPassword = user.isPasswordCorrect(oldPassword);
  if (!checkPassword) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .send(new ApiResponse(200, {}, "Password changed succesfully"));
});
const registerController = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validate each required detail is send and not empty
  //files i.e images are comming  in my case not necessary as not required

  //save in database
  //check for responses whether it is saved or not

  //and also remove password

  //send response
  try {
    const { username, fullName, email, password } = req.body;
    if (
      [username, fullName, email, password].some((elem) => elem?.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new ApiError("409", "User already exists please login");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError("400", "User avatar is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
      throw new ApiError("400", "User avatar is required");
    }

    const user = await User.create({
      email,
      password,
      fullName,
      username,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      username: username.toLowerCase(),
    });
    const createdUser = await User.findById(user?._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering");
    }
    return res
      .status(201)
      .send(new ApiResponse(200, createdUser, "User registered successfuly"));
  } catch (err) {
    throw new ApiError(500, err.msg);
  }
});
const loginController = asyncHandler(async (req, res) => {
  //user details ie username email password
  //check the fields submitted properly
  //check if user exists findByEmail
  //if not return
  //check password
  //create access token and refresh token  by calling method
  //update the contents for login user to send to the client
  //set the options for cookies
  //save in cookies
  //give response

  //send to cookie
  try {
    const { username, email, password } = req.body;
    if (!(username || email)) {
      throw new ApiError(400, "Username or email is required");
    }
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    const loggedinUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    //this means only server can modity the cookies
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, {
        ...options,
        maxAge: 10 * 24 * 24 * 60 * 1000,
      })
      .send(
        new ApiResponse(
          200,
          { user: loggedinUser },
          "User logged in successfully"
        )
      );
  } catch (err) {
    return res.status(500).send({
      name: err.name,
      stack: err.stack,
      message: err.message,
    });
    // throw new ApiError(500, {
    //   name: err.name,
    //   stack: err.stack,
    //   message: err.message,
    // });
  }
});
const logout = asyncHandler(async (req, res) => {
  //get user
  //clear the cookies token from the browser
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      { new: true }
    );
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .send(new ApiResponse(200, {}, "User logged out successfully"));
  } catch (err) {
    throw new ApiError(500, err.msg);
  }
});
const updateUserAccountDetails = asyncHandler(async (req, res) => {
  // fullname ,email get from req.body
  //find user and update  and return response
  const { fullName, email } = req.body;

  User.findb;
  const newUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .send(
      new ApiResponse(
        200,
        { user: newUser },
        "Updated user details successfully"
      )
    );
});
const updateAvatarImage = asyncHandler(async (req, res) => {
  const avatarUrlPath = req.file?.path;

  if (!avatarUrlPath) {
    throw new ApiError(400, "Url not found");
  }
  const avatar = await uploadOnCloudinary(avatarUrlPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar not uploaded");
  }
  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .send(new ApiResponse(200, { user }, "Avatar image updated successfully"));
});
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverUrlPath = req.file?.path;
  if (!coverUrlPath) {
    throw new ApiError(400, "Url not found");
  }
  const coverImage = await uploadOnCloudinary(coverUrlPath);
  if (!coverImage) {
    throw new ApiError(400, "Cover image not uploaded");
  }
  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .send(new ApiResponse(200, { user }, "Cover image updated successfully"));
});

//get file  path    req.user.file
export {
  registerController,
  loginController,
  logout,
  refreshAccessToken,
  updateUserAccountDetails,
  updateAvatarImage,
  updateCoverImage,
};
