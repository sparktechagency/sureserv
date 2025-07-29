import Booking from '../models/booking.model.js';
import Provider from '../models/provider.model.js';
import Service from '../models/service.model.js';
import { createNotification } from '../controllers/notification.controller.js';

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const { service: serviceId, addOns } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    let calculatedTotalPrice = service.price;

    if (addOns && Array.isArray(addOns)) {
      calculatedTotalPrice += addOns.reduce((sum, item) => sum + (item.price || 0), 0);
    }

    req.body.totalPrice = calculatedTotalPrice;

    const booking = await Booking.create(req.body);

    // Populate customer and service details for notification
    const populatedBooking = await Booking.findById(booking._id)
      .populate('customer')
      .populate('service');

    // Create booking confirmation notification for customer
    if (populatedBooking.customer) {
      const message = `Your booking for ${populatedBooking.service.name} on ${populatedBooking.date.toDateString()} at ${populatedBooking.timeSlot} has been successfully created.`;
      await createNotification(populatedBooking.customer._id, message, 'booking_confirmation');
    }

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all bookings
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a single booking
export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a booking
export const updateBooking = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id).populate('service').populate('customer').populate('provider');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    const newStatus = req.body.status;

    // Check if status is being updated to 'completed'
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      if (booking.service && booking.service.price) {
        await Provider.findByIdAndUpdate(
          booking.provider,
          { $inc: { totalEarnings: booking.service.price } },
          { new: true }
        );
      } else {
        console.warn(`Service or price not found for booking ${booking._id}. Total earnings not updated.`);
      }
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Create notification if booking status changes
    if (newStatus && newStatus !== oldStatus) {
      let message = '';

      switch (newStatus) {
        case 'confirmed':
          message = `Your booking for ${booking.service.name} on ${booking.date.toDateString()} at ${booking.timeSlot} has been CONFIRMED by the provider.`;
          break;
        case 'cancelled':
          message = `Your booking for ${booking.service.name} on ${booking.date.toDateString()} at ${booking.timeSlot} has been CANCELLED.`;
          break;
        case 'rejected':
          message = `Unfortunately, your booking for ${booking.service.name} on ${booking.date.toDateString()} at ${booking.timeSlot} has been REJECTED by the provider.`;
          break;
        default:
          message = `The status of your booking for ${booking.service.name} on ${booking.date.toDateString()} at ${booking.timeSlot} has been updated to ${newStatus.toUpperCase()}.`;
          break;
      }

      if (booking.customer) {
        await createNotification(booking.customer._id, message, 'booking_status_update');
      }
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    await booking.deleteOne();
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};