import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
import { connectDb } from "./db/index.js";
import { registerSocketHandlers } from "./socket/syncHandlers.js";
const port = process.env.PORT || 8002;

connectDb()
  .then(console.log("Database connected"))
  .catch((err) => {
    console.log("Error in connecting database");
  });
const server = http.createServer(app);
const io = new Server(server);
io.on("connection", (socket) => {
  console.log("User connected", socket.id);
  registerSocketHandlers(io, socket);
});
server.listen(port, () => {
  console.log("Server is running on port ", port);
});
