import Review from '../models/review.model.js';
import Service from '../models/service.model.js';
import Provider from '../models/provider.model.js';
import Booking from '../models/booking.model.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { bookingId, serviceId, rating, comment } = req.body;
    const customerId = req.user.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer.toString() !== customerId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to review this booking.' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed bookings.' });
    }

    const serviceExistsInBooking = booking.services.some(s => s.service.toString() === serviceId);
    if (!serviceExistsInBooking) {
        return res.status(400).json({ success: false, message: 'The specified service is not part of this booking.' });
    }

    const existingReview = await Review.findOne({ booking: bookingId, service: serviceId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this service for this booking.' });
    }

    const review = await Review.create({
      booking: bookingId,
      service: serviceId,
      customer: customerId,
      provider: booking.provider,
      rating,
      comment,
    });

    await calculateAverageRating(booking.provider);

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
    let filter = {};
    if (req.query.service) {
      filter.service = req.query.service;
    }

    const reviews = await Review.find(filter)
      .populate({
        path: 'customer',
        select: 'firstName lastName' // Select specific fields from the User model
      })
      .populate({
        path: 'booking',
        select: 'address', // Select the address field from the Booking
        populate: {
          path: 'address', // Populate the address reference within the booking
          model: 'Address'
        }
      });

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
