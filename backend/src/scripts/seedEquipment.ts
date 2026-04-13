import dotenv from "dotenv";
import mongoose from "mongoose";
import EquipmentModel from "../models/EquipmentModel.js";
import EquipmentUnit from "../models/EquipmentUnit.js";
import Category from "../models/Category.js";

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    throw new Error("MONGO_URL missing");
  }
  await mongoose.connect(uri);

  let kayakCat = await Category.findOne({ name: /^kayak$/i });
  if (!kayakCat) {
    kayakCat = await Category.create({ name: "Kayak", updatedAt: new Date() });
  }

  const model = await EquipmentModel.create({
    categories: [kayakCat._id],
    title: "Tour Kayak",
    description: "Stable touring kayak for river trips.",
    pricePerDay: 25,
    currency: "EUR",
    size: "M",
    images: [],
    active: true,
    updatedAt: new Date()
  });

  await EquipmentUnit.insertMany([
    {
      modelId: model._id,
      unitNumber: 1,
      unitCode: `${model._id.toString().slice(-6).toUpperCase()}-001`,
      condition: "good",
      status: "active",
      updatedAt: new Date()
    },
    {
      modelId: model._id,
      unitNumber: 2,
      unitCode: `${model._id.toString().slice(-6).toUpperCase()}-002`,
      condition: "good",
      status: "active",
      updatedAt: new Date()
    }
  ]);

  await mongoose.disconnect();
  console.log("Seed completed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
