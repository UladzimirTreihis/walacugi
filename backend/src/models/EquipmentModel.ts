import mongoose, { Schema, type InferSchemaType } from "mongoose";

const equipmentModelSchema = new Schema({
  category: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  pricePerDay: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "EUR", trim: true },
  size: { type: String, default: "" },
  images: [{ type: String }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

equipmentModelSchema.index({ category: 1, active: 1 });

export type EquipmentModelDocument = InferSchemaType<typeof equipmentModelSchema>;

export default mongoose.model("EquipmentModel", equipmentModelSchema);
