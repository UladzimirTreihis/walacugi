import { Router } from "express";
import type { Request, Response } from "express";
import type { ClientSession } from "mongodb";
import mongoose from "mongoose";
import EquipmentModel from "../models/EquipmentModel.js";
import EquipmentUnit from "../models/EquipmentUnit.js";
import Reservation from "../models/Reservation.js";
import UnitBlock from "../models/UnitBlock.js";
import { checkAdminToken } from "../utils/middleware.js";
import { isValidDateRange, rangesOverlap } from "../utils/bookingValidation.js";
import { logger } from "../utils/logger.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const models = await EquipmentModel.find().sort({ updatedAt: -1, createdAt: -1 });
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/:modelId", async (req: Request, res: Response) => {
  try {
    const model = await EquipmentModel.findById(req.params.modelId);
    if (!model) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const units = await EquipmentUnit.find({ modelId: model._id }).sort({ unitNumber: 1 });
    res.json({ model, units });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body, updatedAt: new Date() };
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
    res.json(created);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/:modelId", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const updated = await EquipmentModel.findByIdAndUpdate(
      req.params.modelId,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
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
