const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../../models/User.model');
const { sendVerificationCode } = require('../Email/email.service');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, dob, password } = req.body;
    if (![firstName, lastName, email, dob, password].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'First name, last name, email, date of birth, and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const verificationCode = crypto.randomBytes(3).toString('hex');
    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      dob,
      password,
      verificationCode: await bcrypt.hash(verificationCode, 10),
      verificationCodeAttempts: 0,
      verificationCodeSentAt: new Date()
    });

    await user.save();
    await sendVerificationCode(user, verificationCode);

    return res.status(201).json({
      message: 'User registered successfully. Check your email for the verification code.',
      resendAfterSeconds: 30
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'Authentication is not configured' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, COOKIE_OPTIONS);
    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.status(200).json({ message: 'User logged out successfully' });
};

const sendResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(400).json({ message: 'User is not verified' });

    const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    user.resetPasswordCode = await bcrypt.hash(resetCode, 10);
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
    user.resetPasswordVerified = false;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY
      }
    });
    await transporter.sendMail({
      from: process.env.BREVO_Email,
      to: user.email,
      subject: 'Password Reset Code',
      text: `Hello ${user.firstName},\n\nYour password reset code is: ${resetCode}\n\nThis code is valid for 30 minutes. If you did not request a reset, ignore this email.\n\nAirbnb Team`
    });

    return res.status(200).json({ message: 'Reset code sent to your email' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (typeof email !== 'string' || typeof code !== 'string') {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select('+resetPasswordCode');
    if (!user) return res.status(400).json({ message: 'Invalid or expired code' });
    if (
      !user.resetPasswordCode ||
      !user.resetPasswordExpire ||
      user.resetPasswordExpire < Date.now() ||
      !(await bcrypt.compare(code.trim(), user.resetPasswordCode))
    ) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    user.resetPasswordVerified = true;
    await user.save();
    return res.status(200).json({ message: 'Code verified, proceed to reset password' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (typeof email !== 'string' || typeof newPassword !== 'string' || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.resetPasswordVerified || !user.resetPasswordExpire || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: 'A valid reset code must be verified first' });
    }

    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordVerified = false;
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, logout, sendResetCode, verifyResetCode, resetPassword };
