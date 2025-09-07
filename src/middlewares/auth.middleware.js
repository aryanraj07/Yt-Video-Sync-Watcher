import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    console.log(process.env.ACCESS_TOKEN);

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    console.log("Incoming cookies:", req.cookies);
    console.log("Auth header:", req.headers.authorization);
    const dcecodedToken = jwt.verify(token, process.env.ACCESS_TOKEN);
    const user = await User.findById(dcecodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      //todo discussion
      throw new ApiError(401, "Invalid user token");
    }
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, err?.message || "Invalid access token");
  }
});
