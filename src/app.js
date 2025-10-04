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
app.use(morgan());
app.use(cookieParser());
// Get allowed origins from env or fallback to localhost

// CORS middleware
app.set("trust proxy", 1);
app.use((req, res, next) => {
  next();
});

// const allowedOrigins = [
//   "http://localhost:5173", // dev
//   "https://playnwatch.vercel.app", // prod
// ];
app.use(
  cors({
    origin: ["https://playnwatch.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.log("❌ CORS blocked:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true, // ✅ cookies send/receive
//   })
// );

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.get("/api/v1/test-cookie", (req, res) => {
  res.json({ cookies: req.cookies });
});
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/room", roomRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/friend", friendRoutes);
export default app;
