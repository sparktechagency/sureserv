import Booking from '../models/booking.model.js';
import Provider from '../models/provider.model.js';
import Service from '../models/service.model.js';
import { createNotification } from '../controllers/notification.controller.js';

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    const { customer, provider, services, date, timeSlot, description, address, isUrgent, coupon } = req.body;

    if (!customer || !provider || !services || !date || !address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer, provider, services, date, and address are required.' 
      });
    }

    const serviceIds = services.map(s => s.service);
    const serviceDocs = await Service.find({ '_id': { $in: serviceIds } });

    if (serviceDocs.length !== serviceIds.length) {
      return res.status(404).json({ message: 'One or more services not found.' });
    }

    let subtotal = 0;
    const serviceItems = serviceDocs.map(doc => {
      subtotal += doc.price;
      return { service: doc._id, price: doc.price };
    });

    const tax = subtotal * 0.10; // 10% tax
    const totalPrice = subtotal + tax;

    const booking = new Booking({
      customer,
      provider,
      services: serviceItems,
      date,
      timeSlot,
      description,
      address,
      isUrgent,
      coupon,
      subtotal,
      tax,
      totalPrice,
    });

    const newBooking = await booking.save();

    // Create booking confirmation notification for customer
    const populatedBooking = await Booking.findById(newBooking._id).populate('customer');
    if (populatedBooking.customer) {
      const message = `Your booking for ${serviceDocs.length} services on ${new Date(date).toDateString()} has been successfully created.`;
      await createNotification(populatedBooking.customer._id, message, 'booking_confirmation');
    }

    res.status(201).json({
      success: true,
      data: newBooking
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all bookings
export const getBookings = async (req, res) => {
   try {
    const userId = req.user._id;
    
    const bookings = await Booking.find({ 
      $or: [{ customer: userId }, { provider: userId }] 
    }).populate('orderId');
    
    // Filter unpaid bookings
    const unpaidBookings = bookings.filter(booking => {
      return !booking.orderId || 
             booking.orderId.paymentStatus !== 'paid' ||
             booking.orderId.paymentStatus === 'unpaid'
    });
    
    res.status(200).json({
      success: true,
      count: unpaidBookings.length,
      data: unpaidBookings,
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
    let booking = await Booking.findById(req.params.id).populate('services.service').populate('customer').populate('provider');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldStatus = booking.status;
    const newStatus = req.body.status;

    // Check if status is being updated to 'completed'
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      const bookingSubtotal = booking.services.reduce((sum, item) => sum + item.price, 0);
      
      await Provider.findByIdAndUpdate(
        booking.provider,
        { $inc: { totalEarnings: bookingSubtotal } }, // Use calculated subtotal for earnings
        { new: true }
      );

      // Notify admins about completed booking
      const admins = await getAdminUsers();
      for (const admin of admins) {
          await createNotification(admin._id, `Booking ${booking._id} completed by provider ${booking.provider.firstName} ${booking.provider.lastName || ''}.`, 'booking_completed');
      }
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Create notification if booking status changes
    if (newStatus && newStatus !== oldStatus) {
      let message = '';
      const serviceNames = booking.services.map(s => s.service.serviceName).join(', ');

      switch (newStatus) {
        case 'active':
          message = `Your booking for ${serviceNames} on ${booking.date.toDateString()} at ${booking.timeSlot} is now ACTIVE.`;
          break;
        case 'completed':
          message = `Your booking for ${serviceNames} on ${booking.date.toDateString()} at ${booking.timeSlot} has been marked as COMPLETED.`;
          break;
        case 'cancelled':
          message = `Your booking for ${serviceNames} on ${booking.date.toDateString()} at ${booking.timeSlot} has been CANCELLED.`;
          break;
        default:
          message = `The status of your booking for ${serviceNames} on ${booking.date.toDateString()} at ${booking.timeSlot} has been updated to ${newStatus.toUpperCase()}.`;
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

// Get all unpaid bookings
export const getUnpaidBookings = async (req, res) => {
  try {
    const unpaidBookings = await Booking.find({ paymentStatus: 'unpaid' });
    res.status(200).json({
      success: true,
      count: unpaidBookings.length,
      data: unpaidBookings,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all bookings by user
export const getBookingsByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query; // Get status from query parameters

    let filter = { $or: [{ customer: userId }, { provider: userId }] };

    if (status) {
      filter.status = status; // Add status to filter if provided
    }

    const bookings = await Booking.find(filter);
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBookingsByProvider = async (req, res) => {
  try {
    const providerId = req.user._id;
    const { status } = req.query; // Get status from query parameters

    let filter = { provider: providerId };

    if (status) {
      filter.status = status; // Add status to filter if provided
    }

    const bookings = await Booking.find(filter)
      .populate('customer', 'firstName lastName email')
      .populate('services.service', 'serviceName category subcategory')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};