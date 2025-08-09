import Provider from '../models/provider.model.js';
import Address from '../models/address.model.js';
import bcrypt from 'bcryptjs';
import Booking from '../models/booking.model.js';
import { sendSMS } from '../utils/twilio.js';
import User from '../models/user.model.js';

import { generateToken, generateRefreshToken } from './auth.controller.js';

// Get all providers
export const getProviders = async (req, res) => {
  try {
    const providers = await Provider.find();
    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get provider by ID
export const getProviderById = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id).lean(); // Use .lean() for a plain object
    if (provider == null) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Find addresses associated with this provider
    const addresses = await Address.find({ userId: req.params.id });
    provider.addresses = addresses; // Attach addresses to the provider object

    res.json(provider);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Create a new provider
export const createProvider = async (req, res) => {
  const { firstName, lastName, email, contactNumber, password, businessName } = req.body;
  let profilePic = null;
  let nid = null;
  let license = null;
  let addressprof = null;

  if (req.files && req.files['profilePic']) {
    profilePic = req.files['profilePic'][0].path.replace(/\\/g, "/");
  }
  if (req.files && req.files['nid']) {
    nid = req.files['nid'][0].path.replace(/\\/g, "/");
  }
  if (req.files && req.files['license']) {
    license = req.files['license'][0].path.replace(/\\/g, "/");
  }
  if (req.files && req.files['addressprof']) {
    addressprof = req.files['addressprof'][0].path.replace(/\\/g, "/");
  }

  try {
    // Check if user already exists
    let existingUser = await User.findOne({ $or: [{ email }, { contactNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with that email or contact number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    const provider = new Provider({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      profilePic,
      role: 'provider', // Set role explicitly for discriminator
      businessName,
      nid,
      license,
      addressprof,
      rating: 0, // Default rating
      availability: [], // Default empty availability
      otp,
      otpExpires,
      phoneVerified: false, // Set to false initially
    });

    const newProvider = await provider.save();

    // Send OTP via SMS
    const message = `Your SureServ verification code is ${otp}. It is valid for 10 minutes.`;
    await sendSMS(contactNumber, message);

    const accessToken = generateToken(newProvider._id);
    const refreshToken = generateRefreshToken(newProvider._id);

    newProvider.refreshToken = refreshToken;
    await newProvider.save();

    res.status(201).json({
      message: 'Provider registered. OTP sent to your contact number for verification.',
      userId: newProvider._id,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update provider
export const updateProvider = async (req, res) => {
  try {
    const userId = req.user._id; // Get provider ID from authenticated user
    const provider = await Provider.findById(userId);
    if (provider == null) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (req.body.firstName != null) {
      provider.firstName = req.body.firstName;
    }
    if (req.body.lastName != null) {
      provider.lastName = req.body.lastName;
    }
    if (req.body.email != null) {
      provider.email = req.body.email;
    }
    if (req.body.contactNumber != null) {
      provider.contactNumber = req.body.contactNumber;
    }
    // Password update handled by separate route
     // Handle image upload if present
    if (req.files && req.files['profilePic']) {
      provider.profilePic = req.files['profilePic'][0].path.replace(/\\/g, "/"); 
    }
    if (req.files && req.files['nid']) {
      provider.nid = req.files['nid'][0].path.replace(/\\/g, "/");
    }
    if (req.files && req.files['license']) {
      provider.license = req.files['license'][0].path.replace(/\\/g, "/");
    }
    if (req.files && req.files['addressprof']) {
      provider.addressprof = req.files['addressprof'][0].path.replace(/\\/g, "/");
    }

    if (req.body.businessName != null) {
      provider.businessName = req.body.businessName;
    }
    if (req.body.businessAddress != null) {
      provider.businessAddress = req.body.businessAddress;
    }

    const updatedProvider = await provider.save();
    res.json(updatedProvider);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete provider
export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (provider == null) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    await provider.remove();
    res.json({ message: 'Provider deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get daily earnings for a provider
export const getDailyEarnings = async (req, res) => {
  try {
    const providerId = req.params.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyBookings = await Booking.find({
      provider: providerId,
      status: 'completed',
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const dailyEarnings = dailyBookings.reduce((sum, booking) => {
      const bookingTotal = booking.services.reduce((bookingSum, serviceItem) => bookingSum + serviceItem.price, 0);
      return sum + bookingTotal;
    }, 0);

    res.status(200).json({
      success: true,
      providerId,
      date: today.toISOString().split('T')[0],
      dailyEarnings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get monthly earnings for a provider
export const getMonthlyEarnings = async (req, res) => {
  try {
    const providerId = req.params.id;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const monthlyBookings = await Booking.find({
      provider: providerId,
      status: 'completed',
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
    });

    const monthlyEarnings = monthlyBookings.reduce((sum, booking) => {
      const bookingTotal = booking.services.reduce((bookingSum, serviceItem) => bookingSum + serviceItem.price, 0);
      return sum + bookingTotal;
    }, 0);

    res.status(200).json({
      success: true,
      providerId,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      monthlyEarnings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set provider active status
export const setProviderActiveStatus = async (req, res) => {
  try {
    const providerId = req.user._id; // Get provider ID from authenticated user
    const { activeStatus } = req.body;

    const provider = await Provider.findByIdAndUpdate(
      providerId,
      { activeStatus },
      { new: true, runValidators: true }
    );

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    res.status(200).json({
      success: true,
      data: provider,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};