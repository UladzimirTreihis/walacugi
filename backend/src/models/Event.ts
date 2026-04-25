import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { EMPTY_LOCALIZED_TEXT, localizedTextSchema } from "./localized.js";

const eventSchema = new Schema({
  title: { type: localizedTextSchema, required: true },
  images: [{ type: String }],
  description: { type: localizedTextSchema, default: () => ({ ...EMPTY_LOCALIZED_TEXT }) },
  budget: { type: String, default: "" },
  currency: { type: String, default: "" },
  datedAt: { type: Date },
  startDate: { type: Date },
  endDate: { type: Date },
  approxDate: { type: localizedTextSchema, default: () => ({ ...EMPTY_LOCALIZED_TEXT }) },
  countries: [{ type: String }],
  location: { type: localizedTextSchema, default: () => ({ ...EMPTY_LOCALIZED_TEXT }) },
  ageRestriction: { type: localizedTextSchema, default: () => ({ ...EMPTY_LOCALIZED_TEXT }) },
  chatLink: { type: String, default: "" },
  difficultyLevel: { type: Number, min: 1, max: 5 },
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export type EventDocument = InferSchemaType<typeof eventSchema>;

export default mongoose.model("Event", eventSchema);
