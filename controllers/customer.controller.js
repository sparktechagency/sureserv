import Customer from '../models/customer.model.js';
import Address from '../models/address.model.js';
import bcrypt from 'bcryptjs';
import { sendSMS } from '../utils/twilio.js';
import User from '../models/user.model.js';
import { generateToken } from './auth.controller.js';

// Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).lean(); // Use .lean() for a plain object
    if (customer == null) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Find addresses associated with this customer
    const addresses = await Address.find({ userId: req.params.id });
    customer.addresses = addresses; // Attach addresses to the customer object

    res.json(customer);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Create a new customer
export const createCustomer = async (req, res) => {
  const { firstName, lastName, email, contactNumber, password, profilePic } = req.body;

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

    const customer = new Customer({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      profilePic,
      role: 'customer', // Set role explicitly for discriminator
      otp,
      otpExpires,
      phoneVerified: false, // Set to false initially
    });

    const newCustomer = await customer.save();

    // Send OTP via SMS
    const message = `Your SureServ verification code is ${otp}. It is valid for 10 minutes.`;
    await sendSMS(contactNumber, message);

    res.status(201).json({
      message: 'Customer registered. OTP sent to your contact number for verification.',
      userId: newCustomer._id,
      token: generateToken(newCustomer._id),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

 // Verify OTP
// export const verifyOtp = async (req, res) => {
//   const { userId, otp } = req.body;

//   try {
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     if (user.otp !== otp || user.otpExpires < Date.now()) {
//       return res.status(400).json({ message: 'Invalid or expired OTP.' });
//     }

//     user.phoneVerified = true;
//     user.otp = undefined;
//     user.otpExpires = undefined;
//     await user.save();

//     res.status(200).json({
//       message: 'Phone number verified successfully.',
//       token: generateToken(user._id),
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (customer == null) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (req.body.firstName != null) {
      customer.firstName = req.body.firstName;
    }
    if (req.body.lastName != null) {
      customer.lastName = req.body.lastName;
    }
    if (req.body.email != null) {
      customer.email = req.body.email;
    }
    if (req.body.contactNumber != null) {
      customer.contactNumber = req.body.contactNumber;
    }
    // Password update handled by separate route
     if (req.file) {
      customer.profilePic = req.file.path.replace(/\\/g, "/"); 
      // For production: Upload to Cloudinary here and store URL instead
    }

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (customer == null) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.remove();
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};