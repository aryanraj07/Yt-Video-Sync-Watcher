import express from "express";
import {
  createRoom,
  getRooms,
  getSingleRoom,
  joinARoom,
} from "../controllers/room.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = express.Router();
router.route("/").post(verifyJwt, createRoom);
router.route("/").get(verifyJwt, getRooms);
router.route("/:roomId").get(verifyJwt, getSingleRoom);
router.route("/:roomId/join").post(verifyJwt, joinARoom);
export default router;
