const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const passwordHashCost = process.env.SALT_ROUNDS === undefined
  ? 10
  : Number(process.env.SALT_ROUNDS);

if (!Number.isInteger(passwordHashCost) || passwordHashCost < 4 || passwordHashCost > 31) {
  throw new Error('SALT_ROUNDS must be an integer between 4 and 31');
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: true,
    minlength: [3, 'First name must be at least 3 characters long']
  },

  lastName: {
    type: String,
    trim: true,
    required: true,
    minlength: [3, 'Last name must be at least 3 characters long']
  },

  profilePhoto: { type: String, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },

  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: [/^\+[1-9]\d{1,14}$/, 'Please enter a valid international phone number']
  },

  verificationCode: { type: String, select: false },
  verificationCodeAttempts: { type: Number, default: 0, min: 0 },
  verificationCodeSentAt: { type: Date, select: false },
  isVerified: { type: Boolean, default: false },

  dob: {
    type: String,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Please enter dob in YYYY-MM-DD format']
  },

  resetPasswordCode: { type: String, select: false },
  resetPasswordExpire: { type: Date },
  resetPasswordVerified: { type: Boolean, default: false },

  role: { type: String, enum: ['guest', 'host', 'admin'], default: 'guest' },

  passwordHash: { type: String, required: true },
  interests: [{ type: String }],
  aboutMe: { type: String, trim: true, maxlength: 1000 },
  location: {
    type: {
      address: { type: String, trim: true, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    },
    default: {}
  },
  listings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RecentlyViewed' }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  experiences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experience' }]

}, {
  timestamps: true
});



userSchema.virtual('password')
  .set(function (password) {
    this._password = password;
    this.passwordHash = password;
  })
  .get(function () {
    return this._password;
  });



userSchema.path('reviews').validate(function (v) {
  if (Array.isArray(v) && v.length > 0) {
    return this.role === 'host';
  }
  return true;
}, 'Only users who role "host" can add reviews.');



userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('passwordHash')) return next();

    this.passwordHash = await bcrypt.hash(this.passwordHash, passwordHashCost);

    next();
  } catch (err) {
    next(err);
  }
});



userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};


module.exports = mongoose.model('User', userSchema);
