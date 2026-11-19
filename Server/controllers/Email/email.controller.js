const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../../models/User.model');
const { sendVerificationCode } = require('./email.service');

const RESEND_INTERVAL_MS = 30 * 1000;
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 3;

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (typeof email !== 'string' || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select('+verificationCode +verificationCodeSentAt');

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Email is already verified' });
    if (!user.verificationCode) {
      return res.status(400).json({ message: 'Verification code is unavailable. Request a new code.' });
    }
    if (
      !user.verificationCodeSentAt ||
      Date.now() - user.verificationCodeSentAt.getTime() > VERIFICATION_CODE_TTL_MS
    ) {
      user.verificationCode = undefined;
      user.verificationCodeAttempts = 0;
      user.verificationCodeSentAt = undefined;
      await user.save();
      return res.status(400).json({ message: 'Verification code expired. Request a new code.' });
    }
    if (user.verificationCodeAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many incorrect attempts. Request a new code.' });
    }

    const isValidCode = await bcrypt.compare(code.trim().toLowerCase(), user.verificationCode);
    if (!isValidCode) {
      user.verificationCodeAttempts += 1;
      if (user.verificationCodeAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        user.verificationCode = undefined;
      }
      await user.save();

      const attemptsRemaining = MAX_VERIFICATION_ATTEMPTS - user.verificationCodeAttempts;
      return res.status(attemptsRemaining ? 400 : 429).json({
        message: attemptsRemaining
          ? `Invalid verification code. ${attemptsRemaining} attempt(s) remaining.`
          : 'Too many incorrect attempts. Request a new code.'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Authentication is not configured' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeAttempts = 0;
    user.verificationCodeSentAt = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res.status(200).json({
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+verificationCode +verificationCodeSentAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: 'Email is already verified'
      });
    }

    const elapsedMs = user.verificationCodeSentAt
      ? Date.now() - user.verificationCodeSentAt.getTime()
      : RESEND_INTERVAL_MS;

    if (elapsedMs < RESEND_INTERVAL_MS) {
      return res.status(429).json({
        message: 'Please wait before requesting another code',
        resendAfterSeconds: Math.ceil(
          (RESEND_INTERVAL_MS - elapsedMs) / 1000
        )
      });
    }

    const code = crypto.randomBytes(3).toString('hex');

    // Send email first
    await sendVerificationCode(user, code);

    // Save code only after successful email submission
    user.verificationCode = await bcrypt.hash(code, 10);
    user.verificationCodeAttempts = 0;
    user.verificationCodeSentAt = new Date();

    await user.save();

    return res.status(200).json({
      message: 'Verification code sent successfully',
      resendAfterSeconds: RESEND_INTERVAL_MS / 1000
    });

  } catch (error) {
    console.error('Resend verification error:', error);

    return res.status(500).json({
      message: 'Failed to send verification code'
    });
  }
};


module.exports = {
  verifyEmail,
  resendVerificationCode,
  MAX_VERIFICATION_ATTEMPTS,
  VERIFICATION_CODE_TTL_MS
};
