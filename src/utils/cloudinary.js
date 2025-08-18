import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

async function uploadOnCloudinary(localPath) {
  try {
    if (!localPath) return; //
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    console.log("FIle uploaded with url ", response.url);
    return response;
  } catch (err) {
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    console.error("Upload error:", err);
    return null;
  }
}
// Upload an image
export { uploadOnCloudinary };
