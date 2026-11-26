const { createImageUploadSignature } = require("../config/cloudinary");

const createUploadSignature = (req, res) => {
  try {
    const uploadParams = createImageUploadSignature(req.user._id.toString());
    return res.status(200).json(uploadParams);
  } catch (error) {
    console.error("Could not create Cloudinary upload signature:", error);
    return res.status(500).json({
      message: "Image uploads are temporarily unavailable.",
    });
  }
};

module.exports = { createUploadSignature };
