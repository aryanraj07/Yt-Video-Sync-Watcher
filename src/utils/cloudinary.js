import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: "dnefuj8rd",
  api_key: "937929829647857",
  api_secret: "<your_api_secret>", // Click 'View API Keys' above to copy your API secret
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
    fs.unlinkSync(localPath); //temporarly remove the file from the server
    return null;
  }
}
// Upload an image
export { uploadOnCloudinary };
