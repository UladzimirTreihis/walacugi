import mongoose, { Schema, type InferSchemaType } from "mongoose";

const eventSchema = new Schema({
  title: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String, default: "" },
  budget: { type: String, default: "" },
  currency: { type: String, default: "" },
  startDate: { type: Date },
  endDate: { type: Date },
  approxDate: { type: String, default: "" },
  countries: [{ type: String }],
  location: { type: String, default: "" },
  ageRestriction: { type: String, default: "" },
  chatLink: { type: String, default: "" },
  difficultyLevel: { type: Number, min: 1, max: 5 },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export type EventDocument = InferSchemaType<typeof eventSchema>;

export default mongoose.model("Event", eventSchema);
