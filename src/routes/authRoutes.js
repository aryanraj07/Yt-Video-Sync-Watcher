import express from "express";
import {
  changeCurrentPassword,
  loginController,
  logout,
  refreshAccessToken,
  registerController,
} from "../controllers/authControllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const router = express.Router();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),

  registerController
);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/login").post(loginController);
router.route("/logout").post(verifyJwt, logout);
router.route("/reset-password").post(verifyJwt, changeCurrentPassword);
router.route("/check").get(verifyJwt, (req, res) => {
  res
    .status(200)
    .send(new ApiResponse(200, { user: req.user }, "User verified"));
});

export default router;
