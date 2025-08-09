// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },

  email: {
    type: String,
    unique: true,
    sparse: true, // allow email to be optional if login by phone
  },

  contactNumber: {
    type: String,
    unique: true,
    required: function () {
      return !this.googleId && !this.facebookId;
    },
  },

  phoneVerified: {
    type: Boolean,
    default: false,
  },

  password: {
    type: String,
    required: function () {
      return !this.googleId && !this.facebookId;
    },
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },

  facebookId: {
    type: String,
    unique: true,
    sparse: true,
  },

  role: {
    type: String,
    enum: ['customer', 'provider', 'admin'],
    default: 'customer',
  },

  profilePic: {
    type: String,
    default: 'default-avatar.png', // Default avatar image
  },
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  otp: String,
  otpExpires: Date,
  status: {
    type: String,
    enum: ['active', 'suspended', 'blocked'],
    default: 'active',
  },
  refreshToken: String,
});

const User = mongoose.model('User', userSchema);
export default User;

