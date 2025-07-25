import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: String,
  description: String,
  image: String,
  address: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled", "disputed"],
    default: "pending"
  },
  addOns: [{
    name: String,
    price: Number
  }],
  isUrgent: {
    type: Boolean,
    default: false
  },
  totalPrice: Number,
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid"
  },
  coupon: String,
}, { timestamps: true }); 

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
