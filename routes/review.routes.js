import express from 'express';
import {
  createReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';

const router = express.Router();

router.route('/').post(createReview).get(getReviews);
router.route('/:id').get(getReview).put(updateReview).delete(deleteReview);

export default router;