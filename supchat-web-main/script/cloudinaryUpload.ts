import type { CloudinaryUploadResult } from "../src/redux/types";

export const uploadToCloudinary = async (file: File): Promise<string | null> => {
  const cloudName = "dyopwudvq";
  const uploadPreset = "unsigned_preset";

  // Create a custom filename with timestamp
  const originalName = file.name.split(".")[0]; // removes extension
  const timestamp = new Date().getTime(); // get timestamp in ms
  const customFileName = `${originalName}_${timestamp}`; // ex: myphoto_1717527740000

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("public_id", customFileName); // 👈 tell Cloudinary what to name the file

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data: CloudinaryUploadResult = await res.json();
    return data.secure_url; // ✅ URL of uploaded image
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return null;
  }
};