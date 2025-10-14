import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import cors from "cors";
const app = express();
import userRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
app.use(express.json({ limit: "16kb" }));
app.use(morgan());
app.use(cookieParser());
// Get allowed origins from env or fallback to localhost

// CORS middleware
app.set("trust proxy", 1);
app.use((req, res, next) => {
  next();
});

const allowedOrigins = [
  "http://localhost:5173", // dev
  "https://playnwatch.vercel.app", // prod
];
// app.use(
//   cors({
//     origin: [
//       "https://playnwatch.vercel.app", // frontend production
//       "http://localhost:5173", // frontend local
//     ],
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true, // ✅ allow cookies
//   })
// );

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // ✅ cookies send/receive
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.get("/api/v1/test-cookie", (req, res) => {
  res
    .cookie("test", "12345", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    })
    .send({ message: "Cookie should be set!" });
});
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/room", roomRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/friend", friendRoutes);
app.use("/api/v1/notification", notificationRoutes);
export default app;
