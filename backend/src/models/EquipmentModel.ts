import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { EMPTY_LOCALIZED_TEXT, localizedTextSchema } from "./localized.js";

const priceTiersSchema = new Schema(
  {
    d1_2: { type: Number, required: true, min: 0 },
    d3_4: { type: Number, required: true, min: 0 },
    d5_7: { type: Number, required: true, min: 0 },
    d8_14: { type: Number, required: true, min: 0 },
    d15_plus: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const equipmentModelSchema = new Schema({
  /** @deprecated Prefer `categories`; kept for older documents */
  category: { type: String, trim: true },
  categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  title: { type: localizedTextSchema, required: true },
  description: { type: localizedTextSchema, default: () => ({ ...EMPTY_LOCALIZED_TEXT }) },
  /** @deprecated Prefer `priceTiers`; kept for older documents / migration */
  pricePerDay: { type: Number, min: 0 },
  priceTiers: { type: priceTiersSchema, required: true },
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
