import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addFriendController,
  getAllfreinds,
  getSingleFriend,
  removeFriends,
  respondFriendRequestController,
  searchUser,
  sendFriendRequestController,
} from "../controllers/friend.Controllers.js";
const router = express.Router();
router.route("/search").get(verifyJwt, searchUser);
router.route("/friend-request").post(verifyJwt, sendFriendRequestController);
router.route("/add").post(verifyJwt, addFriendController);
router.route("/").get(verifyJwt, getAllfreinds);
router.route("/:usrname").get(verifyJwt, getSingleFriend);
router.route("/:username").delete(verifyJwt, removeFriends);
router
  .route("/respond-request")
  .post(verifyJwt, respondFriendRequestController);

export default router;
