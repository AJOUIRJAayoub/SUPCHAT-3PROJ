// Utility functions used across the backend
const cloudinary = require("../config/cloudinary");

const uploadProfileImage = async (base64Image) => {
  if (!base64Image) throw new Error("No Base64 image provided");

  const uploadResponse = await cloudinary.uploader.upload(base64Image, {
    folder: "profile_pictures",
  });

  return uploadResponse.secure_url;
};
const deleteProfileImage = async (profilePicture) => {
  try {
    const publicId = profilePicture.split("/").pop().split(".")[0];

    await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);

    user.profilePicture = "";
    await user.save();
  } catch (error) {}
};

module.exports = { uploadProfileImage, deleteProfileImage };
