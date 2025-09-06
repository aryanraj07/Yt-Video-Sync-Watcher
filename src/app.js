import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import cors from "cors";
const app = express();
import userRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
app.use(express.json({ limit: "16kb" }));
const cors = require("cors");

// Get allowed origins from env or fallback to localhost

// CORS middleware
console.log(process.env.FRONTEND_URL);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(morgan());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/room", roomRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/friend", friendRoutes);
export default app;
