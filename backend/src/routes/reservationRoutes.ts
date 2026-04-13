import { Router } from "express";
import type { Request, Response } from "express";
import Reservation from "../models/Reservation.js";
import { checkAdminToken } from "../utils/middleware.js";

const router = Router();

router.get("/", checkAdminToken, async (_req: Request, res: Response) => {
  try {
    const items = await Reservation.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put("/:id/status", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const status = String(req.body.status ?? "");
    if (!["hold", "confirmed", "cancelled", "expired"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
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

export default router;
