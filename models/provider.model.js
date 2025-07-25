import mongoose from 'mongoose';
import User from './user.model.js';

const Provider = User.discriminator('Provider', new mongoose.Schema({
  nid: String, // National ID
  license: String, // Business license number or details
  rating: { type: Number, default: 0 },
  availability: [{
    day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    slots: [String] // e.g., ["09:00-11:00", "14:00-16:00"]
  }],

}, { discriminatorKey: 'role' }));

export default Provider;
