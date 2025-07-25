import Booking from '../models/booking.model.js';
import Service from '../models/service.model.js';
import User from '../models/user.model.js';
import moment from 'moment';

// Create Booking
export const createBooking = async (req, res) => {
  const { serviceId, date, timeSlot, addOns, isUrgent } = req.body;

  // 1. Validate provider availability
  const service = await Service.findById(serviceId).populate("provider");
  if (!service) {
    return res.status(404).json({ error: "Service not found" });
  }
  const provider = await User.findById(service.provider);

  const isAvailable = provider.availability.some(slot =>
    slot.day === moment(date).format("ddd") &&
    slot.slots.includes(timeSlot)
  );

  if (!isAvailable) {
    return res.status(400).json({ error: "Provider not available at this time" });
  }

  // 2. Calculate price
  let totalPrice = service.price;
  if (isUrgent) totalPrice *= 1.2; // 20% urgent charge
  if (addOns) {
    addOns.forEach(addOn => { totalPrice += addOn.price });
  }

  // 3. Create booking
  const booking = new Booking({
    customer: req.user.id,
    provider: provider._id,
    service: serviceId,
    date,
    timeSlot,
    addOns,
    isUrgent,
    totalPrice
  });

  await booking.save();

  // 4. Emit real-time alert to provider (assuming you have socket.io setup)
  // io.to(provider._id.toString()).emit("new_booking", booking);

  res.status(201).json(booking);
};

// Get all bookings (for admin or specific user)
export const getBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query = { customer: req.user.id };
    } else if (req.user.role === 'provider') {
      query = { provider: req.user.id };
    }

    const bookings = await Booking.find(query)
      .populate('customer', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'name description');

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single booking
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'name description');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ensure user can only access their own bookings unless admin
    if (req.user.role === 'customer' && booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'provider' && booking.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only provider or admin can update status
    if (req.user.role !== 'admin' && booking.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
