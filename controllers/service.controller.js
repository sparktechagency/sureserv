import Service from '../models/service.model.js';
import Provider from '../models/provider.model.js';

// Get all services (can be filtered by providerId)
export const getServices = async (req, res) => {
  const { category, subcategory, search } = req.query;
  try {
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i'); // 'i' for case-insensitive
      filter.$or = [
        { serviceName: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { subcategory: { $regex: searchRegex } },
      ];
    }

    const services = await Service.find(filter);
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single service by ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service == null) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new service
export const createService = async (req, res) => {
  const { serviceName, category, subcategory, yearsOfExperience, description, price, serviceImage, address } = req.body;
  const providerId = req.user._id; // Get provider ID from authenticated user
  let newServiceImage = null;

  if (req.file) {
    newServiceImage = req.file.path.replace(/\\/g, "/");
  }

  if (!serviceName || !category) {
    return res.status(400).json({ message: 'Service name and category are required' });
  }

  try {
    const provider = await Provider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const service = new Service({
      providerId,
      serviceName,
      category,
      subcategory,
      yearsOfExperience,
      description,
      price,
      serviceImage: newServiceImage || serviceImage,
      address,
    });

    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Update a service
export const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service == null) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if the authenticated user is the owner of the service
    if (service.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to update this service.' });
    }

    if (req.body.serviceName != null) service.serviceName = req.body.serviceName;
    if (req.body.category != null) service.category = req.body.category;
    if (req.body.subcategory != null) service.subcategory = req.body.subcategory;
    if (req.body.yearsOfExperience != null) service.yearsOfExperience = req.body.yearsOfExperience;
    if (req.body.description != null) service.description = req.body.description;
    if (req.body.price != null) service.price = req.body.price;
    if (req.body.serviceImage != null) service.serviceImage = req.body.serviceImage;
    if (req.body.address != null) service.address = req.body.address;

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// Delete a service
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service == null) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if the authenticated user is the owner of the service
    if (service.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to delete this service.' });
    }

    await service.deleteOne();
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get logged in provider's services
// @route   GET /api/v1/services/me
// @access  Private (Provider)
export const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ providerId: req.user._id });
    res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all unique categories and subcategories
export const getServiceCategoriesAndSubcategories = async (req, res) => {
  try {
    const [categories, subcategories] = await Promise.all([
      Service.distinct('category'),
      Service.distinct('subcategory'),
    ]);
    res.json({ categories, subcategories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
