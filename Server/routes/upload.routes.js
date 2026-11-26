const express = require("express");
const { createUploadSignature } = require("../controllers/upload.controller");
const auth = require("../middleware/userMiddleware");

const router = express.Router();

/**
 * @swagger
 * /uploads/signature:
 *   post:
 *     summary: Get signed parameters for a direct Cloudinary image upload
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signed upload parameters
 *       401:
 *         description: Authentication required
 */
router.post("/signature", auth, createUploadSignature);

module.exports = router;
