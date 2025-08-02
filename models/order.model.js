import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // An array of references to the individual booking documents
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  }],
  subtotal: { 
    type: Number, 
    required: true 
  },
  tax: { 
    type: Number, 
    required: true 
  },
  promoCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode',
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  orderStatus: {
    type: String,
    enum: ['pending_payment', 'processing', 'completed', 'cancelled'],
    default: 'pending_payment',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
