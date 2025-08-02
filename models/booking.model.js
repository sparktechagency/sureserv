import mongoose from 'mongoose';

const serviceItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const bookingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
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
  services: [serviceItemSchema],
  date: {
    type: Date,
    required: true
  },
  timeSlot: String,
  description: String,
  image: String,
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address',
  },
  status: {
    type: String,
    enum: ["active", "upcoming", "completed", "cancelled"],
    default: "upcoming"
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  coupon: String,
}, { timestamps: true }); 

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
