import { verifyJwt } from "../middlewares/auth.middleware.js";
import express from "express";
import {
  getUserNotifications,
  markAllNotificationRead,
  markNotificationRead,
  removeNotifications,
} from "../controllers/notification.controller.js";
const router = express.Router();
router.route("/").get(verifyJwt, getUserNotifications);
router.route("/:id/read").put(verifyJwt, markNotificationRead);
router.route("/:id").delete(verifyJwt, removeNotifications);
router.route("/mark-all-read").patch(verifyJwt, markAllNotificationRead);
export default router;
