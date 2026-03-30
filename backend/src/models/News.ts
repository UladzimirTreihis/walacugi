import mongoose, { Schema, type InferSchemaType } from "mongoose";

const newsSchema = new Schema({
  title: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String, required: true },
  datedAt: { type: Date, default: Date.now },
  pinned: { type: Boolean, default: false },
  location: { type: String, default: "" },
  countries: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export type NewsDocument = InferSchemaType<typeof newsSchema>;

export default mongoose.model("News", newsSchema);
