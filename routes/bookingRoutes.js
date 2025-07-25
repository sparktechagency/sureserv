import express from 'express';
import { createBooking, getBookings, getBookingById, updateBookingStatus } from '../controllers/bookingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createBooking);
router.get('/', authenticate, getBookings);
router.get('/:id', authenticate, getBookingById);
router.put('/:id/status', authenticate, authorize('provider', 'admin'), updateBookingStatus);

export default router;
