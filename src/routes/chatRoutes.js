import express from "express";
import { getMessages, sendMessage } from "../controllers/chat.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.route("/:roomId").post(verifyJwt, sendMessage);
router.route("/:roomId").get(verifyJwt, getMessages);
router.route("/").get((req, res) => {
  res.send("Hello");
});

export default router;
