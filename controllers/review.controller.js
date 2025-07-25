import Review from '../models/review.model.js';
import Service from '../models/service.model.js';
import Customer from '../models/customer.model.js';

// Get all reviews for a specific service
export const getReviewsByService = async (req, res) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.serviceId })
      .populate('customerId', 'firstName lastName email contactNumber') // Populate customer details
      .populate('serviceId', 'serviceName'); // Populate service name
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single review by ID
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customerId', 'firstName lastName email contactNumber')
      .populate('serviceId', 'serviceName');
    if (review == null) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new review
export const createReview = async (req, res) => {
  const { serviceId, rating, reviewText } = req.body;
  const customerId = req.user.id; // Assuming user ID is stored in req.user after authentication

  if (!serviceId || !rating || !reviewText) {
    return res.status(400).json({ message: 'Service ID, rating, and review text are required' });
  }

  try {
    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if customer exists (optional, but good for data integrity)
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const review = new Review({
      serviceId,
      customerId,
      rating,
      reviewText,
    });

    const newReview = await review.save();
    res.status(201).json(newReview);
  } catch (err) {
    if (err.code === 11000) { // Duplicate key error (customer already reviewed this service)
      return res.status(409).json({ message: 'You have already reviewed this service.' });
    }
    res.status(400).json({ message: err.message });
  }
};

// Update a review (only by the customer who created it)
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (review == null) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Ensure the review belongs to the authenticated customer
    if (review.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    if (req.body.rating != null) review.rating = req.body.rating;
    if (req.body.reviewText != null) review.reviewText = req.body.reviewText;

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a review (only by the customer who created it or by an admin)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (review == null) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Ensure the review belongs to the authenticated customer or is an admin
    if (review.customerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await review.remove();
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
