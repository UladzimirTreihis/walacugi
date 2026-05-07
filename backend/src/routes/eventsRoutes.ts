import { Router } from "express";
import type { Request, Response } from "express";
import Event from "../models/Event.js";
import { checkAdminToken } from "../utils/middleware.js";
import { HttpError } from "../utils/httpErrors.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { getLocalizedText, getRequestedLang, isLocalizedText } from "../utils/localizedFields.js";

const router = Router();

function parseEventLocalizedPayload(body: Record<string, unknown>) {
  if (!isLocalizedText(body.title)) return null;
  if (!isLocalizedText(body.description)) return null;
  if (!isLocalizedText(body.location)) return null;
  if (!isLocalizedText(body.approxDate)) return null;
  if (!isLocalizedText(body.ageRestriction)) return null;
  return {
    ...body,
    title: body.title,
    description: body.description,
    location: body.location,
    approxDate: body.approxDate,
    ageRestriction: body.ageRestriction
  };
}

function toLocalizedEvent(event: Record<string, unknown>, lang: ReturnType<typeof getRequestedLang>) {
  if (
    !isLocalizedText(event.title) ||
    !isLocalizedText(event.description) ||
    !isLocalizedText(event.location) ||
    !isLocalizedText(event.approxDate) ||
    !isLocalizedText(event.ageRestriction)
  ) {
    return null;
  }
  return {
    ...event,
    title: getLocalizedText(event.title, lang),
    description: getLocalizedText(event.description, lang),
    location: getLocalizedText(event.location, lang),
    approxDate: getLocalizedText(event.approxDate, lang),
    ageRestriction: getLocalizedText(event.ageRestriction, lang)
  };
}

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const lang = getRequestedLang(req);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
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
          sortEffectiveDate: 1,
          createdAt: -1
        }
      }
    ]);
    res.json(events.map((event: Record<string, unknown>) => toLocalizedEvent(event, lang)).filter(Boolean));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const lang = getRequestedLang(req);
    const item = await Event.findById(req.params.id);
    if (!item) {
      throw new HttpError(404, "Not found");
    }
    const localized = toLocalizedEvent(item.toObject(), lang);
    if (!localized) {
      throw new HttpError(500, "Invalid stored content");
    }
    res.json(localized);
  })
);

router.post(
  "/",
  checkAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const lang = getRequestedLang(req);
    const normalized = parseEventLocalizedPayload(req.body as Record<string, unknown>);
    if (!normalized) {
      throw new HttpError(
        400,
        "title, description, location, approxDate, and ageRestriction must be localized objects { en, be, pl }"
      );
    }
    const body = { ...normalized, updatedAt: new Date() };
    const newEvent = new Event(body);
    const saved = await newEvent.save();
    const localized = toLocalizedEvent(saved.toObject(), lang);
    if (!localized) {
      throw new HttpError(500, "Invalid stored content");
    }
    res.json(localized);
  })
);

router.put(
  "/:id",
  checkAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const lang = getRequestedLang(req);
    const normalized = parseEventLocalizedPayload(req.body as Record<string, unknown>);
    if (!normalized) {
      throw new HttpError(
        400,
        "title, description, location, approxDate, and ageRestriction must be localized objects { en, be, pl }"
      );
    }
    const payload = { ...normalized, updatedAt: new Date() };
    const updated = await Event.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) {
      throw new HttpError(404, "Not found");
    }
    const localized = toLocalizedEvent(updated.toObject(), lang);
    if (!localized) {
      throw new HttpError(500, "Invalid stored content");
    }
    res.json(localized);
  })
);

router.delete(
  "/:id",
  checkAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) {
      throw new HttpError(404, "Not found");
    }
    res.json({ message: "Deleted successfully" });
  })
);

export default router;
