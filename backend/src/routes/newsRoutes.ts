import { Router } from "express";
import type { Request, Response } from "express";
import News from "../models/News.js";
import { checkAdminToken } from "../utils/middleware.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
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

    const items = result[0]?.items ?? [];
    const totalItems = result[0]?.totalCount?.[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    res.json({
      items,
      page,
      limit,
      totalItems,
      totalPages
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const item = await News.findById(req.params.id);
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
    const newNews = new News({
      ...req.body,
      updatedAt: new Date()
    });
    const saved = await newNews.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.put("/:id", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const updated = await News.findByIdAndUpdate(
      req.params.id,
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

router.delete("/:id", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const deleted = await News.findByIdAndDelete(req.params.id);
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
