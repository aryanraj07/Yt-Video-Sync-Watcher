import express from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addFriendController } from "../controllers/friend.Controllers.js";
const router = express.Router();
router.route("/add").post(verifyJwt, addFriendController);

export default router;
