import dotenv from "dotenv";
import mongoose from "mongoose";
import News from "../models/News.js";
import Event from "../models/Event.js";
import EquipmentModel from "../models/EquipmentModel.js";
import Category from "../models/Category.js";
import { logger } from "../utils/logger.js";
import { isLocalizedText, type LocalizedText } from "../utils/localizedFields.js";

dotenv.config();

const MONGO_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD;
const MONGO_DATABASE = process.env.MONGO_DATABASE;
const fallbackUri = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017/${MONGO_DATABASE}?authSource=admin`;
const DB_URI = process.env.MONGO_URL || fallbackUri;

type AnyDoc = Record<string, unknown> & { _id: mongoose.Types.ObjectId };

const DEFAULT_SOURCE_LANG = "be";

function needsMigration(value: unknown) {
  return typeof value === "string" || value == null || !isLocalizedText(value);
}

function buildLocalizedFrom(value: unknown) {
  if (isLocalizedText(value)) {
    return value;
  }
  const text = typeof value === "string" ? value : "";
  const out: LocalizedText = { en: "", be: "", pl: "" };
  out[DEFAULT_SOURCE_LANG] = text;
  return out;
}

async function migrateCollection(
  collectionName: string,
  model: mongoose.Model<AnyDoc>,
  fields: string[]
) {
  const docs = await model.find({}).lean();
  const ops: mongoose.AnyBulkWriteOperation<AnyDoc>[] = [];

  for (const doc of docs) {
    const $set: Record<string, unknown> = {};
    for (const field of fields) {
      const current = doc[field];
      if (needsMigration(current)) {
        $set[field] = buildLocalizedFrom(current);
      }
    }
    if (Object.keys($set).length > 0) {
      $set.updatedAt = new Date();
      ops.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set }
        }
      });
    }
  }

  if (ops.length === 0) {
    logger.info("migrate_localized_content_noop", { collection: collectionName });
    return;
  }

  await model.bulkWrite(ops);
  logger.info("migrate_localized_content_updated", {
    collection: collectionName,
    updatedCount: ops.length
  });
}

async function run() {
  await mongoose.connect(DB_URI);
  logger.info("migrate_localized_content_started");
  try {
    await migrateCollection("news", News as unknown as mongoose.Model<AnyDoc>, ["title", "description", "location"]);
    await migrateCollection("events", Event as unknown as mongoose.Model<AnyDoc>, [
      "title",
      "description",
      "location",
      "approxDate",
      "ageRestriction"
    ]);
    await migrateCollection("equipmentmodels", EquipmentModel as unknown as mongoose.Model<AnyDoc>, [
      "title",
      "description",
      "size"
    ]);
    await migrateCollection("categories", Category as unknown as mongoose.Model<AnyDoc>, ["name"]);
    logger.info("migrate_localized_content_finished");
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  logger.error("migrate_localized_content_failed", { error: err });
  process.exitCode = 1;
});
