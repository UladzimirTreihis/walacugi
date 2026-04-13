import mongoose, { Schema, type InferSchemaType } from "mongoose";

const equipmentUnitSchema = new Schema({
  modelId: { type: Schema.Types.ObjectId, ref: "EquipmentModel", required: true, index: true },
  unitNumber: { type: Number, required: true, min: 1 },
  unitCode: { type: String, required: true, trim: true },
  condition: { type: String, default: "" },
  status: {
    type: String,
    enum: ["active", "maintenance", "retired"],
    default: "active"
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

equipmentUnitSchema.index({ modelId: 1, unitNumber: 1 }, { unique: true });
equipmentUnitSchema.index({ modelId: 1, status: 1 });

export type EquipmentUnitDocument = InferSchemaType<typeof equipmentUnitSchema>;

export default mongoose.model("EquipmentUnit", equipmentUnitSchema);
