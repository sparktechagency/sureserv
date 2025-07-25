import express from 'express';
import {
  getReviewsByService,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all reviews for a specific service
router.get('/services/:serviceId/reviews', getReviewsByService);

// Get a single review by ID
router.get('/:id', getReviewById);

// Create a new review (Customer only)
router.post('/', authenticate, authorize('customer'), createReview);

// Update a review (Customer only, and only their own reviews)
router.patch('/:id', authenticate, authorize('customer'), updateReview);

// Delete a review (Customer who created it or Admin)
router.delete('/:id', authenticate, deleteReview); // Authorization logic is inside the controller

export default router;
