import Service from '../models/service.model.js';
import Provider from '../models/provider.model.js';

// Get all services (can be filtered by providerId)
export const getServices = async (req, res) => {
   const { category, subcategory } = req.query;
  try {
    const filter = {};
    if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;

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
  const { providerId, serviceName, category, subcategory, yearsOfExperience, description, price, serviceImage } = req.body;
  let newServiceImage = null;

  if (req.file) {
    newServiceImage = req.file.path.replace(/\\/g, "/");
  }

  if (!providerId || !serviceName || !category) {
    return res.status(400).json({ message: 'Provider ID, service name, and category are required' });
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

    if (req.body.serviceName != null) service.serviceName = req.body.serviceName;
    if (req.body.category != null) service.category = req.body.category;
    if (req.body.subcategory != null) service.subcategory = req.body.subcategory;
    if (req.body.yearsOfExperience != null) service.yearsOfExperience = req.body.yearsOfExperience;
    if (req.body.description != null) service.description = req.body.description;
    if (req.body.price != null) service.price = req.body.price;
    if (req.body.serviceImage != null) service.serviceImage = req.body.serviceImage;

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

    await service.deleteOne();
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
