import Provider from '../models/provider.model.js';
import bcrypt from 'bcryptjs';

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
