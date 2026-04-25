import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { EMPTY_LOCALIZED_TEXT, localizedTextSchema } from "./localized.js";

const newsSchema = new Schema({
  title: { type: localizedTextSchema, required: true },
  images: [{ type: String }],
  description: { type: localizedTextSchema, required: true },
  datedAt: { type: Date, default: Date.now },
  pinned: { type: Boolean, default: false },
  location: { type: localizedTextSchema, default: () => ({ ...EMPTY_LOCALIZED_TEXT }) },
  countries: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export type NewsDocument = InferSchemaType<typeof newsSchema>;

export default mongoose.model("News", newsSchema);
