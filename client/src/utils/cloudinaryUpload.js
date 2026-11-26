import axios from "axios";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const uploadImageToCloudinary = async (file) => {
  if (!file || !SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  try {
    const { data: uploadParams } = await axios.post(
      "/api/uploads/signature",
      {},
      { withCredentials: true }
    );
    const uploadData = new FormData();
    uploadData.append("file", file);
    Object.entries(uploadParams).forEach(([key, value]) => {
      if (key !== "cloudName") uploadData.append(key, value);
    });

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/image/upload`,
      uploadData
    );

    if (!response.data?.secure_url) {
      throw new Error("Cloudinary did not return an image URL.");
    }

    return response.data.secure_url;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.response?.data?.error?.message ||
        error.message ||
        "Image upload failed."
    );
  }
};

export const uploadImagesToCloudinary = async (files = []) => {
  if (files.length > 10) {
    throw new Error("You can upload a maximum of 10 images at a time.");
  }
  return Promise.all(files.map(uploadImageToCloudinary));
};
