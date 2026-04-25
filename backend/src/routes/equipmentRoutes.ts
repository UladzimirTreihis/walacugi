import { Router } from "express";
import type { Request, Response } from "express";
import type { ClientSession } from "mongodb";
import mongoose from "mongoose";
import EquipmentModel from "../models/EquipmentModel.js";
import EquipmentUnit from "../models/EquipmentUnit.js";
import Reservation from "../models/Reservation.js";
import UnitBlock from "../models/UnitBlock.js";
import Category from "../models/Category.js";
import { checkAdminToken } from "../utils/middleware.js";
import { isValidDateRange, rangesOverlap } from "../utils/bookingValidation.js";
import { logger } from "../utils/logger.js";

const router = Router();

type PopulatedCategory = { _id: mongoose.Types.ObjectId; name: string };

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toEquipmentModelDto(doc: {
  _id: mongoose.Types.ObjectId;
  category?: string;
  categories?: PopulatedCategory[] | mongoose.Types.ObjectId[];
  title: string;
  description: string;
  pricePerDay: number;
  currency?: string;
  size?: string;
  images: string[];
  active: boolean;
  createdAt: Date;
  updatedAt?: Date;
}) {
  const rawCats = doc.categories;
  const cats: { _id: string; name: string }[] = [];
  if (Array.isArray(rawCats)) {
    for (const c of rawCats) {
      if (c && typeof c === "object" && "name" in c && typeof (c as PopulatedCategory).name === "string") {
        cats.push({ _id: String((c as PopulatedCategory)._id), name: (c as PopulatedCategory).name });
      }
    }
  }
  const categoryDisplay = cats.length > 0 ? cats.map((c) => c.name).join(", ") : (doc.category ?? "");
  return {
    _id: String(doc._id),
    categories: cats,
    categoryDisplay,
    title: doc.title,
    description: doc.description,
    pricePerDay: doc.pricePerDay,
    currency: doc.currency,
    size: doc.size,
    images: doc.images ?? [],
    active: doc.active,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt
      ? doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : String(doc.updatedAt)
      : undefined
  };
}

function normalizeCategoryIds(input: unknown): string[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const ids = [...new Set(input.map((id) => String(id)).filter(Boolean))];
  if (ids.length === 0) return null;
  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
  }
  return ids;
}

async function categoryNameTaken(name: string, excludeId?: string) {
  const pattern = new RegExp(`^${escapeRegex(name.trim())}$`, "i");
  const q: Record<string, unknown> = { name: pattern };
  if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
    q._id = { $ne: excludeId };
  }
  return Category.findOne(q).lean();
}

async function modelIdsWithAvailabilityInRange(
  modelIds: mongoose.Types.ObjectId[],
  start: Date,
  end: Date
): Promise<Set<string>> {
  const out = new Set<string>();
  if (modelIds.length === 0) return out;

  const units = await EquipmentUnit.find({
    modelId: { $in: modelIds },
    status: { $ne: "retired" }
  });

  const unitIds = units.map((u) => u._id);
  if (unitIds.length === 0) return out;

  const [reservations, blocks] = await Promise.all([
    Reservation.find({
      unitId: { $in: unitIds },
      status: { $in: ["hold", "confirmed"] },
      startDate: { $lt: end },
      endDate: { $gt: start }
    }),
    UnitBlock.find({
      unitId: { $in: unitIds },
      startDate: { $lt: end },
      endDate: { $gt: start }
    })
  ]);

  for (const unit of units) {
    if (unit.status !== "active") continue;
    const hasReservation = reservations.some(
      (r) => String(r.unitId) === String(unit._id) && rangesOverlap({ startDate: start, endDate: end }, r)
    );
    if (hasReservation) continue;
    const hasBlock = blocks.some(
      (b) => String(b.unitId) === String(unit._id) && rangesOverlap({ startDate: start, endDate: end }, b)
    );
    if (hasBlock) continue;
    out.add(String(unit.modelId));
  }

  return out;
}

router.get("/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/categories", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const name = String(req.body.name ?? "").trim();
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    if (await categoryNameTaken(name)) {
      res.status(409).json({ error: "A category with this name already exists" });
      return;
    }
    const created = await Category.create({ name, updatedAt: new Date() });
    res.json(created);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("duplicate key")) {
      res.status(409).json({ error: "A category with this name already exists" });
      return;
    }
    res.status(400).json({ error: msg });
  }
});

router.put("/categories/:categoryId", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const categoryId = String(req.params.categoryId ?? "");
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      res.status(400).json({ error: "Invalid category id" });
      return;
    }
    const name = String(req.body.name ?? "").trim();
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    if (await categoryNameTaken(name, categoryId)) {
      res.status(409).json({ error: "A category with this name already exists" });
      return;
    }
    const updated = await Category.findByIdAndUpdate(
      categoryId,
      { name, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("duplicate key")) {
      res.status(409).json({ error: "A category with this name already exists" });
      return;
    }
    res.status(400).json({ error: msg });
  }
});

router.delete("/categories/:categoryId", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const categoryId = String(req.params.categoryId ?? "");
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      res.status(400).json({ error: "Invalid category id" });
      return;
    }
    const inUse = await EquipmentModel.exists({ categories: categoryId });
    if (inUse) {
      res.status(409).json({ error: "Cannot delete a category that is still assigned to equipment" });
      return;
    }
    const deleted = await Category.findByIdAndDelete(categoryId);
    if (!deleted) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const categoryId = String(req.query.categoryId ?? "").trim();
    const fromRaw = String(req.query.from ?? "").trim();
    const toRaw = String(req.query.to ?? "").trim();

    const match: Record<string, unknown> = {};
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      match.categories = categoryId;
    }

    let models = await EquipmentModel.find(match).populate("categories", "name").sort({ updatedAt: -1, createdAt: -1 }).lean();

    if (fromRaw && toRaw) {
      const start = new Date(fromRaw);
      const end = new Date(toRaw);
      if (isValidDateRange(start, end)) {
        const modelIds = models.map((m) => m._id as mongoose.Types.ObjectId);
        const available = await modelIdsWithAvailabilityInRange(modelIds, start, end);
        models = models.filter((m) => available.has(String(m._id)));
      }
    }

    res.json(models.map((m) => toEquipmentModelDto(m as Parameters<typeof toEquipmentModelDto>[0])));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/:modelId", async (req: Request, res: Response) => {
  try {
    const modelId = String(req.params.modelId ?? "");
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const model = await EquipmentModel.findById(modelId).populate("categories", "name").lean();
    if (!model) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const units = await EquipmentUnit.find({ modelId: model._id }).sort({ unitNumber: 1 });
    res.json({ model: toEquipmentModelDto(model as Parameters<typeof toEquipmentModelDto>[0]), units });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const categoryIds = normalizeCategoryIds(req.body.categories);
    if (!categoryIds) {
      res.status(400).json({ error: "At least one category is required" });
      return;
    }
    const found = await Category.countDocuments({ _id: { $in: categoryIds } });
    if (found !== categoryIds.length) {
      res.status(400).json({ error: "One or more categories do not exist" });
      return;
    }
    const payload = {
      categories: categoryIds,
      title: req.body.title,
      description: req.body.description ?? "",
      pricePerDay: Number(req.body.pricePerDay),
      currency: req.body.currency ?? "PLN",
      size: req.body.size ?? "",
      images: Array.isArray(req.body.images) ? req.body.images : [],
      active: req.body.active !== false,
      updatedAt: new Date()
    };
    const created = await EquipmentModel.create(payload);
    const unitCode = `${created._id.toString().slice(-6).toUpperCase()}-001`;
    await EquipmentUnit.create({
      modelId: created._id,
      unitNumber: 1,
      unitCode,
      condition: "good",
      status: "active",
      updatedAt: new Date()
    });
    const populated = await EquipmentModel.findById(created._id).populate("categories", "name").lean();
    res.json(populated ? toEquipmentModelDto(populated as Parameters<typeof toEquipmentModelDto>[0]) : created);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/:modelId", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const modelId = String(req.params.modelId ?? "");
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const categoryIds = normalizeCategoryIds(req.body.categories);
    if (!categoryIds) {
      res.status(400).json({ error: "At least one category is required" });
      return;
    }
    const found = await Category.countDocuments({ _id: { $in: categoryIds } });
    if (found !== categoryIds.length) {
      res.status(400).json({ error: "One or more categories do not exist" });
      return;
    }
    const updated = await EquipmentModel.findByIdAndUpdate(
      modelId,
      {
        categories: categoryIds,
        title: req.body.title,
        description: req.body.description ?? "",
        pricePerDay: Number(req.body.pricePerDay),
        currency: req.body.currency ?? "PLN",
        size: req.body.size ?? "",
        images: Array.isArray(req.body.images) ? req.body.images : [],
        active: req.body.active !== false,
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate("categories", "name")
      .lean();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(toEquipmentModelDto(updated as Parameters<typeof toEquipmentModelDto>[0]));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/:modelId", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const modelId = req.params.modelId;
    await EquipmentModel.findByIdAndDelete(modelId);
    const units = await EquipmentUnit.find({ modelId }).select("_id");
    const unitIds = units.map((unit) => unit._id);
    await EquipmentUnit.deleteMany({ modelId });
    await Reservation.deleteMany({ unitId: { $in: unitIds } });
    await UnitBlock.deleteMany({ unitId: { $in: unitIds } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/units/:unitId/clone", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const source = await EquipmentUnit.findById(req.params.unitId);
    if (!source) {
      res.status(404).json({ error: "Unit not found" });
      return;
    }
    const lastUnit = await EquipmentUnit.findOne({ modelId: source.modelId }).sort({ unitNumber: -1 });
    const nextNumber = (lastUnit?.unitNumber ?? source.unitNumber) + 1;
    const unitCode = `${source.modelId.toString().slice(-6).toUpperCase()}-${String(nextNumber).padStart(3, "0")}`;
    const cloned = await EquipmentUnit.create({
      modelId: source.modelId,
      unitNumber: nextNumber,
      unitCode,
      condition: source.condition,
      status: "active",
      updatedAt: new Date()
    });
    res.json(cloned);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/units/:unitId", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const updated = await EquipmentUnit.findByIdAndUpdate(
      req.params.unitId,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: "Unit not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/units/:unitId/unavailable", async (req: Request, res: Response) => {
  try {
    const unit = await EquipmentUnit.findById(req.params.unitId);
    if (!unit) {
      res.status(404).json({ error: "Unit not found" });
      return;
    }

    const fromRaw = String(req.query.from ?? "");
    const toRaw = String(req.query.to ?? "");
    const from = fromRaw ? new Date(fromRaw) : new Date();
    const to = toRaw ? new Date(toRaw) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    if (!isValidDateRange(from, to)) {
      res.status(400).json({ error: "Invalid unavailable range query" });
      return;
    }

    const [reservations, blocks] = await Promise.all([
      Reservation.find({
        unitId: unit._id,
        status: { $in: ["hold", "confirmed"] },
        startDate: { $lt: to },
        endDate: { $gt: from }
      }).sort({ startDate: 1 }),
      UnitBlock.find({
        unitId: unit._id,
        startDate: { $lt: to },
        endDate: { $gt: from }
      }).sort({ startDate: 1 })
    ]);

    const unavailableRanges = [
      ...reservations.map((item) => ({
        startDate: item.startDate.toISOString().slice(0, 10),
        endDate: item.endDate.toISOString().slice(0, 10),
        reason: "reserved"
      })),
      ...blocks.map((item) => ({
        startDate: item.startDate.toISOString().slice(0, 10),
        endDate: item.endDate.toISOString().slice(0, 10),
        reason: item.reason || "blocked"
      }))
    ];

    if (unit.status !== "active") {
      unavailableRanges.push({
        startDate: from.toISOString().slice(0, 10),
        endDate: to.toISOString().slice(0, 10),
        reason: `status:${unit.status}`
      });
    }

    res.json({
      unitId: String(unit._id),
      unitStatus: unit.status,
      unavailableRanges
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.delete("/units/:unitId", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const unitId = req.params.unitId;
    await EquipmentUnit.findByIdAndDelete(unitId);
    await Reservation.deleteMany({ unitId });
    await UnitBlock.deleteMany({ unitId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/:modelId/availability", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const units = await EquipmentUnit.find({ modelId: req.params.modelId, status: { $ne: "retired" } }).sort({ unitNumber: 1 });
    if (!start || !end || !isValidDateRange(start, end)) {
      const baseline = units.map((unit) => ({ unitId: unit._id, available: unit.status === "active", reason: "" }));
      res.json({ units: baseline });
      return;
    }

    const unitIds = units.map((unit) => unit._id);
    const [reservations, blocks] = await Promise.all([
      Reservation.find({
        unitId: { $in: unitIds },
        status: { $in: ["hold", "confirmed"] },
        startDate: { $lt: end },
        endDate: { $gt: start }
      }),
      UnitBlock.find({
        unitId: { $in: unitIds },
        startDate: { $lt: end },
        endDate: { $gt: start }
      })
    ]);

    const result = units.map((unit) => {
      if (unit.status !== "active") {
        return { unitId: unit._id, available: false, reason: `status:${unit.status}` };
      }
      const hasReservation = reservations.some(
        (r) => String(r.unitId) === String(unit._id) && rangesOverlap({ startDate: start, endDate: end }, r)
      );
      if (hasReservation) return { unitId: unit._id, available: false, reason: "reserved" };
      const hasBlock = blocks.some(
        (b) => String(b.unitId) === String(unit._id) && rangesOverlap({ startDate: start, endDate: end }, b)
      );
      if (hasBlock) return { unitId: unit._id, available: false, reason: "blocked" };
      return { unitId: unit._id, available: true, reason: "" };
    });

    res.json({ units: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/units/:unitId/blocks", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (!isValidDateRange(startDate, endDate)) {
      res.status(400).json({ error: "Invalid block date range" });
      return;
    }
    const created = await UnitBlock.create({
      unitId: req.params.unitId,
      startDate,
      endDate,
      reason: req.body.reason ?? "",
      updatedAt: new Date()
    });
    res.json(created);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/blocks/:blockId", checkAdminToken, async (req: Request, res: Response) => {
  try {
    await UnitBlock.findByIdAndDelete(req.params.blockId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/confirm-booking", checkAdminToken, async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  const startedAtMs = Date.now();
  const logContext = {
    requestId: req.requestId,
    route: "POST /api/equipment/confirm-booking"
  };
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
      logger.warn("confirm_booking_empty_items", logContext);
      res.status(400).json({ error: "No checkout items provided" });
      return;
    }

    const checkoutRef = String(req.body.checkoutRef ?? "");
    logger.info("confirm_booking_started", {
      ...logContext,
      checkoutRef,
      itemCount: items.length
    });
    const results: Array<{ unitId: string; ok: boolean; reason?: string }> = [];

    const processItems = async (sessionArg: ClientSession | null) => {
      for (const item of items) {
        const unitId = String(item.unitId ?? "");
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        if (!unitId || !isValidDateRange(startDate, endDate)) {
          logger.warn("confirm_booking_invalid_item", {
            ...logContext,
            unitId,
            startDate: item.startDate,
            endDate: item.endDate
          });
          results.push({ unitId, ok: false, reason: "Invalid date range" });
          continue;
        }

        const unitQuery = EquipmentUnit.findById(unitId);
        if (sessionArg) unitQuery.session(sessionArg);
        const unit = await unitQuery;
        if (!unit || unit.status !== "active") {
          logger.warn("confirm_booking_unit_unavailable", {
            ...logContext,
            unitId
          });
          results.push({ unitId, ok: false, reason: "Unit unavailable" });
          continue;
        }

        const conflictReservationQuery = Reservation.findOne({
          unitId,
          status: { $in: ["hold", "confirmed"] },
          startDate: { $lt: endDate },
          endDate: { $gt: startDate }
        });
        const conflictBlockQuery = UnitBlock.findOne({
          unitId,
          startDate: { $lt: endDate },
          endDate: { $gt: startDate }
        });
        if (sessionArg) {
          conflictReservationQuery.session(sessionArg);
          conflictBlockQuery.session(sessionArg);
        }
        const [conflictReservation, conflictBlock] = await Promise.all([
          conflictReservationQuery,
          conflictBlockQuery
        ]);

        if (conflictReservation || conflictBlock) {
          logger.warn("confirm_booking_date_conflict", {
            ...logContext,
            unitId,
            hasReservation: Boolean(conflictReservation),
            hasBlock: Boolean(conflictBlock)
          });
          results.push({ unitId, ok: false, reason: "Date range conflict" });
          continue;
        }

        const reservationPayload = {
          unitId,
          startDate,
          endDate,
          status: "confirmed",
          checkoutRef,
          updatedAt: new Date()
        };
        if (sessionArg) {
          await Reservation.create([reservationPayload], { session: sessionArg });
        } else {
          await Reservation.create(reservationPayload);
        }

        results.push({ unitId, ok: true });
      }
    };

    let usedTransaction = true;
    try {
      await session.withTransaction(async () => {
        await processItems(session);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const noTransactionSupport = message.includes("Transaction numbers are only allowed on a replica set member or mongos");
      if (!noTransactionSupport) throw err;

      usedTransaction = false;
      results.length = 0;
      logger.warn("confirm_booking_transactions_not_supported_fallback", {
        ...logContext,
        reason: message
      });
      await processItems(null);
    }

    logger.info("confirm_booking_completed", {
      ...logContext,
      checkoutRef,
      itemCount: items.length,
      successCount: results.filter((item) => item.ok).length,
      failedCount: results.filter((item) => !item.ok).length,
      usedTransaction,
      durationMs: Date.now() - startedAtMs
    });
    res.json({ results });
  } catch (err) {
    logger.error("confirm_booking_failed", {
      ...logContext,
      durationMs: Date.now() - startedAtMs,
      error: err
    });
    res.status(400).json({ error: (err as Error).message });
  } finally {
    await session.endSession();
  }
});

export default router;
