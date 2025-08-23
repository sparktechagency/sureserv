import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/email.js';
import { sendSMS } from '../utils/twilio.js';

// Generate JWT
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

// Generate Refresh Token
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// Refresh Token
export const refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Refresh token not provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const accessToken = generateToken(user._id);
    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};


// Verify OTP for a logged-in user
export const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user._id; // Get user ID from authenticated user

  try {
    const user = await User.findById(userId);

    if (!user) {
      // This case should rarely happen due to the authenticate middleware
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.phoneVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Phone number verified successfully.' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Resend OTP
export const resendOtp = async (req, res) => {
  const { userId } = req.body; // Get user ID from request body

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send new OTP via SMS
    const message = `Your new SureServ verification code is ${otp}. It is valid for 10 minutes.`;
    await sendSMS(user.contactNumber, message);

    res.status(200).json({ message: 'New OTP sent to your contact number.' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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

  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    contactNumber: user.contactNumber,
    role: user.role,
    accessToken,
    refreshToken,
  });
};

// Logout User
export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Token not provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Update user password
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from authenticated user
    const user = await User.findById(userId);
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

// Request password reset
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User with that email does not exist.' });
    }

    // Generate a 4-digit numeric code
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Set token and expiry on user model
    user.resetPasswordToken = crypto.createHash('sha256').update(resetCode).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    const message = `Your password reset code is ${resetCode}. It is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Code (SureServ)',
        message,
      });

      res.status(200).json({
        message: 'Password reset code sent to your email.',
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return res.status(500).json({
        message: 'There was an error sending the email. Try again later.',
        error: emailError.message,
      });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  const { token, password, passwordConfirm } = req.body;

  if (!token || !password || !passwordConfirm) {
    return res.status(400).json({ message: 'Please provide token, password, and password confirmation.' });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    const hashedCode = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been reset.' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
