import mongoose from 'mongoose';

const serviceFeeSchema = new mongoose.Schema({
  fee: {
    type: Number,
    required: true,
  },
});

const ServiceFee = mongoose.model('ServiceFee', serviceFeeSchema);
export default ServiceFee;
