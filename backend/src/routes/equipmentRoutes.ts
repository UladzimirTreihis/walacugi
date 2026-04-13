import { Router } from "express";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import EquipmentModel from "../models/EquipmentModel.js";
import EquipmentUnit from "../models/EquipmentUnit.js";
import Reservation from "../models/Reservation.js";
import UnitBlock from "../models/UnitBlock.js";
import { checkAdminToken } from "../utils/middleware.js";
import { isValidDateRange, rangesOverlap } from "../utils/bookingValidation.js";

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
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
      res.status(400).json({ error: "No checkout items provided" });
      return;
    }

    const checkoutRef = String(req.body.checkoutRef ?? "");
    const results: Array<{ unitId: string; ok: boolean; reason?: string }> = [];

    await session.withTransaction(async () => {
      for (const item of items) {
        const unitId = String(item.unitId ?? "");
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        if (!unitId || !isValidDateRange(startDate, endDate)) {
          results.push({ unitId, ok: false, reason: "Invalid date range" });
          continue;
        }

        const unit = await EquipmentUnit.findById(unitId).session(session);
        if (!unit || unit.status !== "active") {
          results.push({ unitId, ok: false, reason: "Unit unavailable" });
          continue;
        }

        const [conflictReservation, conflictBlock] = await Promise.all([
          Reservation.findOne({
            unitId,
            status: { $in: ["hold", "confirmed"] },
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
          }).session(session),
          UnitBlock.findOne({
            unitId,
            startDate: { $lt: endDate },
            endDate: { $gt: startDate }
          }).session(session)
        ]);

        if (conflictReservation || conflictBlock) {
          results.push({ unitId, ok: false, reason: "Date range conflict" });
          continue;
        }

        await Reservation.create(
          [
            {
              unitId,
              startDate,
              endDate,
              status: "confirmed",
              checkoutRef,
              updatedAt: new Date()
            }
          ],
          { session }
        );

        results.push({ unitId, ok: true });
      }
    });

    res.json({ results });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  } finally {
    await session.endSession();
  }
});

export default router;
