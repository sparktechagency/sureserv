import Address from '../models/address.model.js';
import User from '../models/user.model.js';

// Get all addresses for a user
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.params.userId });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single address by ID
export const getAddressById = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (address == null) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new address for a user
export const createAddress = async (req, res) => {
  const { title, locationAddress, locationDescription } = req.body;
  const userId = req.params.userId;

  if (!title || !locationAddress) {
    return res.status(400).json({ message: 'Title and location address are required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const address = new Address({
      userId,
      title,
      locationAddress,
      locationDescription,
    });

    const newAddress = await address.save();

    // Add the new address's ID to the user's addresses array
    user.addresses.push(newAddress._id);
    await user.save();

    res.status(201).json(newAddress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update an address
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (address == null) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const { title, locationAddress, locationDescription } = req.body;

    if (title != null) address.title = title;
    if (locationAddress != null) address.locationAddress = locationAddress;
    if (locationDescription != null) address.locationDescription = locationDescription;

    const updatedAddress = await address.save();
    res.json(updatedAddress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an address
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (address == null) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Remove the address's ID from the user's addresses array
    const user = await User.findById(address.userId);
    if (user) {
      user.addresses = user.addresses.filter(addrId => addrId.toString() !== address._id.toString());
      await user.save();
    }

    await address.remove();
    res.json({ message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
