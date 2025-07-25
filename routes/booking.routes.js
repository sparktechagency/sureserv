import express from 'express';
import {
  createBooking,
  deleteBooking,
  getBooking,
  getBookings,
  updateBooking,
} from '../controllers/booking.controller.js';

const router = express.Router();

router.route('/').get(getBookings).post(createBooking);
router.route('/:id').get(getBooking).put(updateBooking).delete(deleteBooking);

export default router;
