import { Router } from "express";
import type { Request, Response } from "express";
import Event from "../models/Event.js";
import { checkAdminToken } from "../utils/middleware.js";
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

router.get("/", async (_req: Request, res: Response) => {
  try {
    const lang = getRequestedLang(_req);
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
          sortEffectiveDate: 1,
          createdAt: -1
        }
      }
    ]);
    res.json(events.map((event: Record<string, unknown>) => toLocalizedEvent(event, lang)).filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const lang = getRequestedLang(req);
    const item = await Event.findById(req.params.id);
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const localized = toLocalizedEvent(item.toObject(), lang);
    if (!localized) {
      res.status(500).json({ error: "Invalid localized content shape in stored event item" });
      return;
    }
    res.json(localized);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const lang = getRequestedLang(req);
    const normalized = parseEventLocalizedPayload(req.body as Record<string, unknown>);
    if (!normalized) {
      res.status(400).json({
        error: "title, description, location, approxDate, and ageRestriction must be localized objects { en, be, pl }"
      });
      return;
    }
    const body = { ...normalized, updatedAt: new Date() };
    const newEvent = new Event(body);
    const saved = await newEvent.save();
    const localized = toLocalizedEvent(saved.toObject(), lang);
    if (!localized) {
      res.status(500).json({ error: "Invalid localized content shape in stored event item" });
      return;
    }
    res.json(localized);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/:id", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const lang = getRequestedLang(req);
    const normalized = parseEventLocalizedPayload(req.body as Record<string, unknown>);
    if (!normalized) {
      res.status(400).json({
        error: "title, description, location, approxDate, and ageRestriction must be localized objects { en, be, pl }"
      });
      return;
    }
    const payload = { ...normalized, updatedAt: new Date() };
    const updated = await Event.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const localized = toLocalizedEvent(updated.toObject(), lang);
    if (!localized) {
      res.status(500).json({ error: "Invalid localized content shape in stored event item" });
      return;
    }
    res.json(localized);
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
