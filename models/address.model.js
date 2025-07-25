import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  locationAddress: {
    type: String,
    required: true,
  },
  locationDescription: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Address = mongoose.model('Address', addressSchema);
export default Address;
