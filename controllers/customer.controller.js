import Customer from '../models/customer.model.js';
import bcrypt from 'bcryptjs';

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
    const customer = await Customer.findById(req.params.id);
    if (customer == null) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Create a new customer
export const createCustomer = async (req, res) => {
  const { firstName, lastName, email, contactNumber, password, profilePic } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const customer = new Customer({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      profilePic,
      role: 'customer', // Set role explicitly for discriminator
    });

    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

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
