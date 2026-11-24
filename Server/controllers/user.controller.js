const User = require("../models/User.model.js");
const { uploadOnCloudinary } = require('../config/cloudinary.js');

exports.becomeHost = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role !== 'guest') {
      return res.status(400).json({ message: 'Only guests can become hosts' });
    }

    user.role = 'host';
    await user.save();

    res.json({ message: 'User role updated to host successfully', role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// (admin فقط)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('name firstName lastName  email role _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email) {
      if (email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = email;
      }
    } else {
      user.email = user.email;
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;

    if (password) {
      user.password = password;
    } else {
      user.password = user.password;
    }

    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// delete
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};




const FIELDS_TO_RETURN = [
  'firstName', 'lastName', 'email', 'phone', 'dob', 'createdAt', 'isVerified', 'profilePhoto', 'interests', 'aboutMe', 'role', 'reviews',
  'location', 'listings', 'bookings', 'favorites', 'recentlyViewed', 'services',
  'experiences',
].join(' ');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const userProfile = await User.findById(userId)
      .select(FIELDS_TO_RETURN)
      .populate('reviews', 'rating comment author')
      .populate('services')
      .populate('experiences')
      .populate({
        path: 'recentlyViewed',
        populate: { path: 'listing', select: 'title address' },
      });

    if (!userProfile) {
      return res.status(404).json({ message: "Profile data not found" });
    }

    return res.status(200).json(userProfile);

  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Server error while fetching profile" });
  }
};


const EDITABLE_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'dob', 'interests', 'aboutMe', 'location',
];

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    const unset = {};

    for (const key of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        if ((key === 'phone' || key === 'dob') && req.body[key] === '') {
          unset[key] = 1;
          continue;
        }
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0 && Object.keys(unset).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    if (
      typeof updates.email === 'string' &&
      updates.email.trim().toLowerCase() !== req.user.email
    ) {
      updates.email = updates.email.trim().toLowerCase();
      updates.isVerified = false;
      unset.verificationCode = 1;
      unset.verificationCodeSentAt = 1;
      updates.verificationCodeAttempts = 0;
    }

    const updateOperation = {};
    if (Object.keys(updates).length) updateOperation.$set = updates;
    if (Object.keys(unset).length) updateOperation.$unset = unset;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateOperation,
      { new: true, runValidators: true }
    ).select(FIELDS_TO_RETURN);

    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ message: 'Email is already in use.' });
    }
    res.status(400).json({ message: error.message || 'Failed to update profile.' });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    const { base64Image } = req.body;

    if (!base64Image) {
      return res.status(400).json({ message: "Base64 image string is required." });
    }

    const imageUrl = await uploadOnCloudinary(base64Image);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: imageUrl },
      { new: true }
    ).select('profilePhoto');

    res.status(200).json({
      profilePhoto: imageUrl,
      message: "Profile photo updated successfully."
    });

  } catch (error) {
    console.error("Error during Base64 upload process:", error);
    res.status(500).json({ message: "Server error during image upload." });
  }
};