import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { EMPTY_LOCALIZED_TEXT, localizedTextSchema } from "./localized.js";

const equipmentModelSchema = new Schema({
  /** @deprecated Prefer `categories`; kept for older documents */
  category: { type: String, trim: true },
  categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  title: { type: localizedTextSchema, required: true },
  description: { type: localizedTextSchema, default: () => ({ ...EMPTY_LOCALIZED_TEXT }) },
  pricePerDay: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "PLN", trim: true },
  size: { type: localizedTextSchema, default: () => ({ ...EMPTY_LOCALIZED_TEXT }) },
  images: [{ type: String }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

equipmentModelSchema.index({ categories: 1, active: 1 });

export type EquipmentModelDocument = InferSchemaType<typeof equipmentModelSchema>;

export default mongoose.model("EquipmentModel", equipmentModelSchema);
