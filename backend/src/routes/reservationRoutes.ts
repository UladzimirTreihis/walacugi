import { Router } from "express";
import type { Request, Response } from "express";
import Reservation from "../models/Reservation.js";
import { checkAdminToken } from "../utils/middleware.js";
import { HttpError } from "../utils/httpErrors.js";
import { asyncHandler } from "../utils/errorHandler.js";

const router = Router();

router.get(
  "/",
  checkAdminToken,
  asyncHandler(async (_req: Request, res: Response) => {
    const items = await Reservation.find().sort({ createdAt: -1 });
    res.json(items);
  })
);

router.put(
  "/:id/status",
  checkAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const status = String(req.body.status ?? "");
    if (!["hold", "confirmed", "cancelled", "expired"].includes(status)) {
      throw new HttpError(400, "Invalid status");
    }
    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      throw new HttpError(404, "Not found");
    }
    res.json(updated);
  })
);

export default router;
