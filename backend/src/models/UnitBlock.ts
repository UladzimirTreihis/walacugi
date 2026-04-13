import mongoose, { Schema, type InferSchemaType } from "mongoose";

const unitBlockSchema = new Schema({
  unitId: { type: Schema.Types.ObjectId, ref: "EquipmentUnit", required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

unitBlockSchema.index({ unitId: 1, startDate: 1, endDate: 1 });

export type UnitBlockDocument = InferSchemaType<typeof unitBlockSchema>;

export default mongoose.model("UnitBlock", unitBlockSchema);
