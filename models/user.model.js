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
    required: function() { return !this.googleId; },
  },

  phoneVerified: {
    type: Boolean,
    default: false,
  },

  password: {
    type: String,
    required: function() { return !this.googleId; },
  },

  googleId: {
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
  }
});

const User = mongoose.model('User', userSchema);
export default User;

