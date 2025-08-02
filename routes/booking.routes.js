import express from 'express';
import {
  createBooking,
  deleteBooking,
  getBooking,
  getBookings,
  getUnpaidBookings,
  updateBooking,
  getBookingsByUser,
  getBookingsByProvider
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(authenticate,getBookings).post(createBooking);
router.route('/unpaid').get(getUnpaidBookings);
router.route('/user').get(authenticate, getBookingsByUser);
router.route('/provider').get(authenticate, getBookingsByProvider);
router.route('/:id').get(getBooking).put(updateBooking).delete(deleteBooking);

export default router;
