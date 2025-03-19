import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String },
  date: { type: Date, default: Date.now }, // example field
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Event', EventSchema);
