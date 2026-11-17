import dotenv from "dotenv";
import mongoose from "mongoose";
import EquipmentModel from "../models/EquipmentModel.js";
import { isPriceTiers, tiersFromLegacyPricePerDay } from "../utils/equipmentPricing.js";

dotenv.config();

async function run() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    throw new Error("MONGO_URL missing");
  }
  await mongoose.connect(uri);

  const models = await EquipmentModel.find({}).lean();
  let updated = 0;

  for (const model of models) {
    const doc = model as {
      _id: mongoose.Types.ObjectId;
      pricePerDay?: number;
      priceTiers?: unknown;
    };
    if (isPriceTiers(doc.priceTiers)) {
      continue;
    }
    const legacy = typeof doc.pricePerDay === "number" ? doc.pricePerDay : 0;
    await EquipmentModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          priceTiers: tiersFromLegacyPricePerDay(legacy),
          updatedAt: new Date()
        }
      }
    );
    updated += 1;
  }

  await mongoose.disconnect();
  console.log(`Migration completed. Updated ${updated} of ${models.length} equipment models.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
