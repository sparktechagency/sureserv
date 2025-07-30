import express from 'express';
import {
  createBooking,
  deleteBooking,
  getBooking,
  getBookings,
  getUnpaidBookings,
  updateBooking,
  getBookingsByUser
} from '../controllers/booking.controller.js';

const router = express.Router();

router.route('/').get(getBookings).post(createBooking);
router.route('/unpaid').get(getUnpaidBookings);
router.route('/user/:userId').get(getBookingsByUser);
router.route('/:id').get(getBooking).put(updateBooking).delete(deleteBooking);

export default router;
