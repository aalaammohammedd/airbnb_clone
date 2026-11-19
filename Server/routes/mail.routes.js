const express = require('express');
const emailController = require('../controllers/Email/email.controller');

const router = express.Router();

/**
 * @swagger
 * /mail/verify-email:
 *   post:
 *     summary: Verify an account using the emailed code
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
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       429:
 *         description: Maximum incorrect attempts reached
 */
router.post('/verify-email', emailController.verifyEmail);

/**
 * @swagger
 * /mail/resend:
 *   post:
 *     summary: Send or resend an account verification code
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
 *         description: Verification code sent successfully
 *       404:
 *         description: Account not found
 *       429:
 *         description: Resend cooldown is active
 */
router.post('/resend', emailController.resendVerificationCode);

module.exports = router;
