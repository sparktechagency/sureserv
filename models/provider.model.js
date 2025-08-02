import mongoose from 'mongoose';
import User from './user.model.js';

const Provider = User.discriminator('Provider', new mongoose.Schema({
  nid: String, // National ID
  license: String, // Business license number or details
  addressprof: String,
  rating: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  numberOfReviews: { type: Number, default: 0 },
  activeStatus: { type: Boolean, default: true },
  availability: [{
    day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    slots: [String] // e.g., ["09:00-11:00", "14:00-16:00"]
  }],
  isApproved: {
    type: Boolean,
    default: false,
  },
  isDocumentVerified: {
    type: Boolean,
    default: false,
  },

}, { discriminatorKey: 'role' }));

export default Provider;
