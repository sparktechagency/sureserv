import Review from '../models/review.model.js';
import Service from '../models/service.model.js';
import Provider from '../models/provider.model.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { service: serviceId, rating, comment } = req.body;
    const customerId = req.user.id; // Assuming req.user.id is populated by authentication middleware
    console.log('Creating review for service:', serviceId, 'by customer:', customerId);

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check if a review already exists for this service by this customer
    const existingReview = await Review.findOne({ service: serviceId, customer: customerId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this service.' });
    }

    const review = await Review.create({
      service: serviceId,
      customer: customerId,
      provider: service.providerId,
      rating,
      comment,
    });

    // Update provider's average rating and number of reviews
    await calculateAverageRating(service.providerId);

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to calculate average rating
async function calculateAverageRating(providerId) {
  const stats = await Review.aggregate([
    {
      $match: { provider: providerId }
    },
    {
      $group: {
        _id: '$provider',
        averageRating: { $avg: '$rating' },
        numberOfReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Provider.findByIdAndUpdate(providerId, {
      averageRating: stats[0].averageRating,
      numberOfReviews: stats[0].numberOfReviews
    });
  } else {
    // If no reviews, reset to default
    await Provider.findByIdAndUpdate(providerId, {
      averageRating: 0,
      numberOfReviews: 0
    });
  }
}

// Get all reviews
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('customer').populate('provider').populate('service');
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single review
export const getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('customer').populate('provider').populate('service');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Ensure user is review owner
    if (review.customer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this review' });
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Recalculate average rating after update
    await calculateAverageRating(review.provider);

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Ensure user is review owner
    if (review.customer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    await calculateAverageRating(review.provider);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
