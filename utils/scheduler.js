import cron from 'node-cron';
import Booking from '../models/booking.model.js';
import moment from 'moment';

// Daily at midnight: Mark expired bookings as cancelled
cron.schedule("0 0 * * *", async () => {
  try {
    await Booking.updateMany(
      {
        date: { $lt: new Date() },
        status: "pending"
      },
      { status: "cancelled" }
    );
    console.log('Expired pending bookings cancelled.');
  } catch (error) {
    console.error('Error cancelling expired bookings:', error);
  }
});

// Hourly: Send reminders for upcoming bookings
cron.schedule("0 * * * *", async () => {
  try {
    const upcomingBookings = await Booking.find({
      date: {
        $gte: new Date(),
        $lte: moment().add(1, "hour").toDate()
      },
      status: "confirmed"
    }).populate("customer").populate("service");

    upcomingBookings.forEach(booking => {
      // Assuming you have a sendSMS function or similar notification mechanism
      console.log(
        `Reminder: Your ${booking.service.name} is scheduled at ${booking.timeSlot} for ${booking.customer.name}`
      );
      // sendSMS(
      //   booking.customer.phone,
      //   `Reminder: Your ${booking.service.name} is scheduled at ${booking.timeSlot}`
      // );
    });
    console.log('Upcoming booking reminders sent.');
  } catch (error) {
    console.error('Error sending booking reminders:', error);
  }
});
