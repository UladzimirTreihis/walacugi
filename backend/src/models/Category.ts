import mongoose, { Schema, type InferSchemaType } from "mongoose";

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

categorySchema.index({ name: 1 }, { unique: true });

export type CategoryDocument = InferSchemaType<typeof categorySchema>;

export default mongoose.model("Category", categorySchema);
