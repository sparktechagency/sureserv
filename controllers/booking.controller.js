import Provider from '../models/provider.model.js';
import Service from '../models/service.model.js';
import { createNotification } from '../controllers/notification.controller.js';
import Booking from '../models/booking.model.js';



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
    const bookingId = req.params.id;
    const { status } = req.body;

    let booking = await Booking.findById(bookingId).populate('services.service').populate('customer').populate('provider');
    

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const oldStatus = booking.status;

    // If status is not changing, just return the booking
    if (status === oldStatus) {
      return res.status(200).json({ success: true, data: booking });
    }

    // Update the booking status
    booking.status = status;
    const updatedBooking = await booking.save();

    // If the booking is completed, update the provider's earnings
    if (status === 'completed' && oldStatus !== 'completed') {
      const bookingSubtotal = booking.services.reduce((sum, item) => sum + item.price, 0);
      await Provider.findByIdAndUpdate(booking.provider, { $inc: { totalEarnings: bookingSubtotal } });
    }

    // Create a notification for the customer
    if (booking.customer) {
      let message = '';
      
      const serviceNames = booking.services.map(s => s.service.serviceName).join(', ');

      switch (status) {
        case 'accepted':
          message = `Your booking for ${serviceNames} has been accepted.`;
          break;
        case 'completed':
          message = `Your booking for ${serviceNames} has been completed.`;
          break;
        case 'rejected':
          message = `Your booking for ${serviceNames} has been rejected.`;
          break;
        default:
          message = `The status of your booking for ${serviceNames} has been updated to ${status}.`;
          break;
      }

      await createNotification(booking.customer._id, message, 'booking_status_update');
    }

    res.status(200).json({
      success: true,
      data: updatedBooking,
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