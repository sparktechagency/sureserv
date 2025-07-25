import express from 'express';
import {
  createReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(authenticate, createReview).get(getReviews);
router.route('/:id').get(getReview).put(updateReview).delete(deleteReview);

export default router;