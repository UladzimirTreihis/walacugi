import mongoose, { Schema, type InferSchemaType } from "mongoose";

const reservationSchema = new Schema({
  unitId: { type: Schema.Types.ObjectId, ref: "EquipmentUnit", required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["hold", "confirmed", "cancelled", "expired"],
    default: "confirmed"
  },
  checkoutRef: { type: String, default: "" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reservationSchema.index({ unitId: 1, startDate: 1, endDate: 1, status: 1 });

export type ReservationDocument = InferSchemaType<typeof reservationSchema>;

export default mongoose.model("Reservation", reservationSchema);
