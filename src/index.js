import app from "./app.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
import { connectDb } from "./db/index.js";
const port = process.env.PORT || 8002;
connectDb()
  .then(
    app.listen(port, () => {
      console.log("Server is running on port ", port);
    })
  )
  .catch((err) => {
    console.log("Error in connecting database");
  });
