import mongoose from 'mongoose';

const siteContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const SiteContent = mongoose.model('SiteContent', siteContentSchema);

export default SiteContent;