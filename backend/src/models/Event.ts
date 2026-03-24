import mongoose, { Schema, type InferSchemaType } from "mongoose";

const eventSchema = new Schema({
  title: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export type EventDocument = InferSchemaType<typeof eventSchema>;

export default mongoose.model("Event", eventSchema);
