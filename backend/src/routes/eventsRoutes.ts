import { Router } from "express";
import type { Request, Response } from "express";
import Event from "../models/Event.js";
import { checkAdminToken } from "../utils/middleware.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    // Sorting:
    // 1) pinned first
    // 2) among pinned: by updatedAt desc
    // 3) others: by effectiveDate desc, where effectiveDate = datedAt || startDate
    const events = await Event.aggregate([
      {
        $addFields: {
          sortPinned: { $cond: [{ $eq: ["$pinned", true] }, 1, 0] },
          sortPinnedUpdatedAt: {
            $cond: [{ $eq: ["$pinned", true] }, "$updatedAt", new Date(0)]
          },
          sortEffectiveDate: { $ifNull: ["$datedAt", "$startDate"] }
        }
      },
      {
        $match: {
          sortEffectiveDate: { $gte: twoWeeksAgo }
        }
      },
      {
        $sort: {
          sortPinned: -1,
          sortPinnedUpdatedAt: -1,
          sortEffectiveDate: -1,
          createdAt: -1
        }
      }
    ]);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const item = await Event.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const body = { ...req.body, updatedAt: new Date() };
    const newEvent = new Event(body);
    const saved = await newEvent.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/:id", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const payload = { ...req.body, updatedAt: new Date() };
    const updated = await Event.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.delete("/:id", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
