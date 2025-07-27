import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Generate JWT
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Login User
export const login = async (req, res) => {
  const { email, contactNumber, password } = req.body;

  // Check if user exists by email or contactNumber
  let user;
  if (email) {
    user = await User.findOne({ email });
  } else if (contactNumber) {
    user = await User.findOne({ contactNumber });
  } else {
    return res.status(400).json({ message: 'Please provide an email or contact number' });
  }

  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  res.json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    contactNumber: user.contactNumber,
    role: user.role,
    token: generateToken(user._id),
  });
};

// Logout User (for stateless JWTs, client-side token removal is key)
export const logout = (req, res) => {
  // For stateless JWTs, simply inform the client to remove the token.
  // No server-side action is typically needed unless you implement a token blacklist.
  res.json({ message: 'Logged out successfully' });
};

// Update user password
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { oldPassword, newPassword, newPasswordConfirm } = req.body;

    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      return res.status(400).json({ message: 'Please provide old password, new password, and new password confirmation' });
    }

    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    // Check if old password is correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
