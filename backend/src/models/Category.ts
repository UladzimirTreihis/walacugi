import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { localizedTextSchema } from "./localized.js";

const categorySchema = new Schema({
  name: { type: localizedTextSchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export type CategoryDocument = InferSchemaType<typeof categorySchema>;

export default mongoose.model("Category", categorySchema);
