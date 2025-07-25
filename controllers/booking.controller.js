import Booking from '../models/booking.model.js';
import Provider from '../models/provider.model.js';
import Service from '../models/service.model.js';

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
    let booking = await Booking.findById(req.params.id).populate('service');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if status is being updated to 'completed'
    if (req.body.status === 'completed' && booking.status !== 'completed') {
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
