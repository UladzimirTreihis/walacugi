import { Router } from "express";
import type { Request, Response } from "express";
import News from "../models/News.js";
import { checkAdminToken } from "../utils/middleware.js";
import { HttpError } from "../utils/httpErrors.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { getLocalizedText, getRequestedLang, isLocalizedText } from "../utils/localizedFields.js";

const router = Router();

function parseNewsLocalizedPayload(body: Record<string, unknown>) {
  if (!isLocalizedText(body.title)) return null;
  if (!isLocalizedText(body.description)) return null;
  if (!isLocalizedText(body.location)) return null;
  return {
    ...body,
    title: body.title,
    description: body.description,
    location: body.location
  };
}

function toLocalizedNews(news: Record<string, unknown>, lang: ReturnType<typeof getRequestedLang>) {
  if (!isLocalizedText(news.title) || !isLocalizedText(news.description) || !isLocalizedText(news.location)) {
    return null;
  }
  return {
    ...news,
    title: getLocalizedText(news.title, lang),
    description: getLocalizedText(news.description, lang),
    location: getLocalizedText(news.location, lang)
  };
}

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const lang = getRequestedLang(req);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    /**
     * Sorting rules:
     * - First pinned, ordered by updatedAt desc
     * - Then unpinned, ordered by datedAt desc (fallback to createdAt)
     */
    const result = await News.aggregate([
      {
        $addFields: {
          datedAtOrCreatedAt: { $ifNull: ["$datedAt", "$createdAt"] },
          updatedAtOrCreatedAt: { $ifNull: ["$updatedAt", "$createdAt"] }
        }
      },
      {
        $addFields: {
          sortDate: {
            $cond: [
              { $eq: ["$pinned", true] },
              "$updatedAtOrCreatedAt",
              "$datedAtOrCreatedAt"
            ]
          }
        }
      },
      { $sort: { pinned: -1, sortDate: -1 } },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }, { $project: { datedAtOrCreatedAt: 0, updatedAtOrCreatedAt: 0, sortDate: 0 } }],
          totalCount: [{ $count: "count" }]
        }
      }
    ]);

    const items = (result[0]?.items ?? [])
      .map((item: Record<string, unknown>) => toLocalizedNews(item, lang))
      .filter(Boolean);
    const totalItems = result[0]?.totalCount?.[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    res.json({
      items,
      page,
      limit,
      totalItems,
      totalPages
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const lang = getRequestedLang(req);
    const item = await News.findById(req.params.id);
    if (!item) {
      throw new HttpError(404, "Not found");
    }
    const localized = toLocalizedNews(item.toObject(), lang);
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
    const payload = parseNewsLocalizedPayload(req.body as Record<string, unknown>);
    if (!payload) {
      throw new HttpError(400, "title, description, and location must be localized objects { en, be, pl }");
    }
    const newNews = new News({
      ...payload,
      updatedAt: new Date()
    });
    const saved = await newNews.save();
    const localized = toLocalizedNews(saved.toObject(), lang);
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
    const payload = parseNewsLocalizedPayload(req.body as Record<string, unknown>);
    if (!payload) {
      throw new HttpError(400, "title, description, and location must be localized objects { en, be, pl }");
    }
    const updated = await News.findByIdAndUpdate(
      req.params.id,
      { ...payload, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      throw new HttpError(404, "Not found");
    }
    const localized = toLocalizedNews(updated.toObject(), lang);
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
    const deleted = await News.findByIdAndDelete(req.params.id);
    if (!deleted) {
      throw new HttpError(404, "Not found");
    }
    res.json({ message: "Deleted successfully" });
  })
);

export default router;
