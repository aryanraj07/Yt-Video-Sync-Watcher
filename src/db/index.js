import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDb = async () => {
  try {
    const connection = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      "Mongodb connected successfully and is running on host  ",
      mongoose.connection.host
    );
  } catch (err) {
    console.log("Mongodb connection failed ", err);
    process.exit(1);
  }
};
