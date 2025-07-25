import mongoose from 'mongoose';
import User from './user.model.js';

const Customer = User.discriminator('Customer', new mongoose.Schema({
  // Customer-specific fields can go here if any
  // For now, it inherits all fields from User
}, { discriminatorKey: 'role' }));

export default Customer;
