const { v2: cloudinary } = require("cloudinary");
const crypto = require("crypto");

const getCloudinaryCredentials = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary image uploads are not configured.");
  }

  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  };
};

const createImageUploadSignature = (userId) => {
  const { cloudName, api_key, apiSecret } = getCloudinaryCredentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `airbnb_clone/${userId}/${crypto
    .randomBytes(16)
    .toString("hex")}`;
  const allowedFormats = "jpg,jpeg,png,webp";
  const paramsToSign = {
    allowed_formats: allowedFormats,
    public_id: publicId,
    timestamp,
  };

  return {
    cloudName,
    api_key,
    timestamp,
    public_id: publicId,
    allowed_formats: allowedFormats,
    signature: cloudinary.utils.api_sign_request(paramsToSign, apiSecret),
  };
};

const isOwnedCloudinaryImage = (imageUrl, userId) => {
  try {
    const parsedUrl = new URL(imageUrl);
    const expectedFolder = `/airbnb_clone/${userId}/`;
    return (
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname === "res.cloudinary.com" &&
      parsedUrl.pathname.includes("/image/upload/") &&
      parsedUrl.pathname.includes(expectedFolder)
    );
  } catch {
    return false;
  }
};

const validateCloudinaryImageUrls = (imageUrls, userId) => {
  if (
    !Array.isArray(imageUrls) ||
    imageUrls.length > 10 ||
    imageUrls.some((imageUrl) => !isOwnedCloudinaryImage(imageUrl, userId))
  ) {
    const error = new Error(
      "Images must be valid Cloudinary URLs uploaded by you (maximum 10)."
    );
    error.statusCode = 400;
    throw error;
  }
  return imageUrls;
};

module.exports = {
  createImageUploadSignature,
  isOwnedCloudinaryImage,
  validateCloudinaryImageUrls,
};
