import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  reviewText: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a compound index to ensure a customer can only review a service once
reviewSchema.index({ serviceId: 1, customerId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
