import mongoose from 'mongoose';

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  images: [{ type: String }], // array of image URLs
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('News', NewsSchema);
