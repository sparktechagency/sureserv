import Order from '../models/order.model.js';
import Booking from '../models/booking.model.js';
import Service from '../models/service.model.js';
import User from '../models/user.model.js';
import { createNotification, getAdminUsers } from '../controllers/notification.controller.js';

// Create a new order
export const createOrder = async (req, res) => {
  const {serviceIds, date, timeSlot, description, address, isUrgent, coupon } = req.body;
     const  customerId = req.user._id; // Get customer ID from authenticated user
  if ( !serviceIds || !serviceIds.length) {
    return res.status(400).json({ message: 'Customer ID and a list of service IDs are required.' });
  }

  try {
    const services = await Service.find({ '_id': { $in: serviceIds } }).populate('providerId');

    if (services.length !== serviceIds.length) {
      return res.status(404).json({ message: 'One or more services could not be found.' });
    }

    // Group services by provider
    const servicesByProvider = services.reduce((acc, service) => {
      const providerId = service.providerId._id.toString();
      if (!acc[providerId]) {
        acc[providerId] = [];
      }
      acc[providerId].push(service);
      return acc;
    }, {});

    const newBookings = [];
    let subtotal = 0;

    // Create individual bookings for each provider
    for (const providerId in servicesByProvider) {
      const providerServices = servicesByProvider[providerId];
      const serviceItems = providerServices.map(s => {
        subtotal += s.price;
        return { service: s._id, price: s.price };
      });

      const booking = new Booking({
        // orderId will be set later
        customer: customerId,
        provider: providerId,
        services: serviceItems,
        date,
        timeSlot,
        description,
        address,
        isUrgent,
        coupon,
      });
      newBookings.push(booking);
    }

    const tax = subtotal * 0.10; // 10% tax
    const totalAmount = subtotal + tax;

    // Create the parent order
    const order = new Order({
      customer: customerId,
      subtotal,
      tax,
      totalAmount,
    });

    const savedOrder = await order.save();

    // Now that we have the order ID, link it to the bookings and save them
    const savedBookingIds = [];
    for (const booking of newBookings) {
      booking.orderId = savedOrder._id;
      const savedBooking = await booking.save();
      savedBookingIds.push(savedBooking._id);
    }

    // Finally, update the order with the booking IDs
    savedOrder.bookings = savedBookingIds;
    await savedOrder.save();

    const finalOrder = await Order.findById(savedOrder._id).populate({
      path: 'bookings',
      populate: {
        path: 'provider services.service'
      }
    });

    // Notify admins about new order
    const admins = await getAdminUsers();
    for (const admin of admins) {
        await createNotification(admin._id, `New service order created by ${req.user.firstName} ${req.user.lastName || ''}. Order ID: ${savedOrder._id}`, 'new_order');
    }

    res.status(201).json(finalOrder);

  } catch (error) {
    res.status(500).json({ message: 'Server error while creating order.', error: error.message });
  }
};