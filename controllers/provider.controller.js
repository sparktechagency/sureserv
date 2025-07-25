import Provider from '../models/provider.model.js';
import bcrypt from 'bcryptjs';
import Booking from '../models/booking.model.js';

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
    const provider = await Provider.findById(req.params.id);
    if (provider == null) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json(provider);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Create a new provider
export const createProvider = async (req, res) => {
  const { firstName, lastName, email, contactNumber, password, profilePic, businessName, nid, license } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
      rating: 0, // Default rating
      availability: [] // Default empty availability
    });

    const newProvider = await provider.save();
    res.status(201).json(newProvider);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update provider
export const updateProvider = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
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
    if (req.body.profilePic != null) {
      provider.profilePic = req.body.profilePic;
    }
    if (req.body.businessName != null) {
      provider.businessName = req.body.businessName;
    }
    if (req.body.nid != null) {
      provider.nid = req.body.nid;
    }
    if (req.body.license != null) {
      provider.license = req.body.license;
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
    const providerId = req.params.id; // Assuming provider ID is passed in params

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyBookings = await Booking.find({
      provider: providerId,
      status: 'completed',
      createdAt: { $gte: today, $lt: tomorrow },
    }).populate('service');

    const dailyEarnings = dailyBookings.reduce((sum, booking) => {
      return sum + (booking.service ? booking.service.price : 0);
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
    const providerId = req.params.id; // Assuming provider ID is passed in params

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const monthlyBookings = await Booking.find({
      provider: providerId,
      status: 'completed',
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
    }).populate('service');

    const monthlyEarnings = monthlyBookings.reduce((sum, booking) => {
      return sum + (booking.service ? booking.service.price : 0);
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
    const providerId = req.params.id;
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