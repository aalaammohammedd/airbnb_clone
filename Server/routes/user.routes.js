const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authController = require('../controllers/auth/auth.controller');
const auth = require('../middleware/userMiddleware');
const role = require('../middleware/authUser');
const User = require('../models/User.model');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Create an account before email verification
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, dob, password]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               dob:
 *                 type: string
 *                 format: date
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created; request a verification code separately
 *       400:
 *         description: Invalid registration details or duplicate email
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a verified user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       403:
 *         description: Email verification is required
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Clear the authentication cookie
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /reset/send-code:
 *   post:
 *     summary: Send a password reset code
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset code sent
 */
router.post('/reset/send-code', authController.sendResetCode);

/**
 * @swagger
 * /reset/verify-code:
 *   post:
 *     summary: Verify a password reset code
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code verified
 *       400:
 *         description: Invalid or expired code
 */
router.post('/reset/verify-code', authController.verifyResetCode);

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Set a new password after code verification
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Reset code has not been verified or expired
 */
router.post('/reset-password', authController.resetPassword);

router.get('/', auth, role(['admin']), userController.getAllUsers);
router.get('/users', userController.getAllUsers);
router.get('/allUsers', auth, role(['admin']), userController.getAllUsers);

router.put('/:id', auth, userController.updateUser);
router.put('/users/:id', auth, role(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = req.body.role;
    user.isVerified = true;
    await user.save();
    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/deleteUser/:id', auth, userController.deleteUser);
router.post('/become-host', auth, userController.becomeHost);

router.get('/profile', auth, userController.getProfile);
router.patch('/profile', auth, userController.updateProfile);
/**
 * @swagger
 * /profile/upload:
 *   post:
 *     summary: Save the authenticated user's Cloudinary profile photo URL
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageUrl]
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile photo saved
 *       400:
 *         description: Invalid or unowned Cloudinary image URL
 *       401:
 *         description: Authentication required
 */
router.post('/profile/upload', auth, userController.uploadProfilePhoto);

module.exports = router;
