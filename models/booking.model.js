import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  date: Date,
  timeSlot: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled", "disputed"],
    default: "pending"
  },
  addOns: [{
    name: String,
    price: Number
  }],
  isUrgent: { type: Boolean, default: false },
  totalPrice: Number,
  paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"] }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
