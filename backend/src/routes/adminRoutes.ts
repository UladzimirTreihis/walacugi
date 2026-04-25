import { Router } from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import News from "../models/News.js";
import Event from "../models/Event.js";
import Category from "../models/Category.js";
import EquipmentModel from "../models/EquipmentModel.js";
import EquipmentUnit from "../models/EquipmentUnit.js";
import { checkAdminToken } from "../utils/middleware.js";
import { isLocalizedText } from "../utils/localizedFields.js";

const router = Router();

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_TRANSLATE_MODEL || "gpt-4o-mini";

type EntityType = "news" | "event" | "equipment";

function validateTranslatePayload(body: unknown): { entity: EntityType; source: Record<string, string> } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const entity = b.entity;
  const source = b.source;
  if (entity !== "news" && entity !== "event" && entity !== "equipment") return null;
  if (!source || typeof source !== "object") return null;
  const sourceObj = source as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sourceObj)) {
    if (typeof v !== "string") return null;
    out[k] = v;
  }
  return { entity, source: out };
}

function entityFields(entity: EntityType): string[] {
  if (entity === "news") return ["title", "description", "location"];
  if (entity === "equipment") return ["title", "description", "size"];
  return ["title", "description", "location", "approxDate", "ageRestriction"];
}

router.post("/login", async (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!password || !adminPasswordHash || !jwtSecret) {
    res.status(500).json({ error: "Missing auth configuration" });
    return;
  }

  const isMatch = await bcrypt.compare(password, adminPasswordHash);
  if (!isMatch) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "24h" });
  res.json({ token });
});

router.post("/verify-token", async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) {
    res.status(401).json({ valid: false });
    return;
  }

  jwt.verify(token, jwtSecret, (err) => {
    if (err) {
      res.status(403).json({ valid: false });
      return;
    }
    res.json({ valid: true });
  });
});

router.get("/news/:id/localized", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const item = await News.findById(req.params.id).lean();
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!isLocalizedText(item.title) || !isLocalizedText(item.description) || !isLocalizedText(item.location)) {
      res.status(500).json({ error: "Invalid localized news shape" });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/events/:id/localized", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const item = await Event.findById(req.params.id).lean();
    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (
      !isLocalizedText(item.title) ||
      !isLocalizedText(item.description) ||
      !isLocalizedText(item.location) ||
      !isLocalizedText(item.approxDate) ||
      !isLocalizedText(item.ageRestriction)
    ) {
      res.status(500).json({ error: "Invalid localized event shape" });
      return;
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/categories/localized", checkAdminToken, async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ updatedAt: -1, createdAt: -1 }).lean();
    if (categories.some((item) => !isLocalizedText(item.name))) {
      res.status(500).json({ error: "Invalid localized category shape" });
      return;
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/equipment/:id/localized", checkAdminToken, async (req: Request, res: Response) => {
  try {
    const model = await EquipmentModel.findById(req.params.id).populate("categories", "name").lean();
    if (!model) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!isLocalizedText(model.title) || !isLocalizedText(model.description) || !isLocalizedText(model.size)) {
      res.status(500).json({ error: "Invalid localized equipment shape" });
      return;
    }
    const units = await EquipmentUnit.find({ modelId: model._id }).sort({ unitNumber: 1 }).lean();
    res.json({ model, units });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/translate-localized", checkAdminToken, async (req: Request, res: Response) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }

  const parsed = validateTranslatePayload(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Invalid payload. Expected { entity, source }" });
    return;
  }

  const fields = entityFields(parsed.entity);
  for (const field of fields) {
    if (typeof parsed.source[field] !== "string") {
      res.status(400).json({ error: `Missing source field: ${field}` });
      return;
    }
  }

  const prompt = [
    "Translate the provided JSON field values from source language to English and Polish.",
    "Source is in key `be` and may be Belarusian or Russian.",
    "Output must be valid JSON only, no markdown.",
    "Return shape: {\"en\": { ...same fields... }, \"pl\": { ...same fields... }}.",
    "Preserve HTML tags and structure exactly.",
    "Preserve links, URLs, emojis, placeholders, numbers, and punctuation intent.",
    "Preserve the tone and style of the source text."
  ].join(" ");

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: JSON.stringify({
              fields,
              be: parsed.source
            })
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const details = await response.text();
      res.status(502).json({ error: "OpenAI translation request failed", details });
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      res.status(502).json({ error: "Empty translation response from OpenAI" });
      return;
    }

    let parsedOut: unknown;
    try {
      parsedOut = JSON.parse(raw);
    } catch {
      res.status(502).json({ error: "Invalid JSON response from OpenAI" });
      return;
    }

    if (!parsedOut || typeof parsedOut !== "object") {
      res.status(502).json({ error: "Invalid translation response shape" });
      return;
    }
    const translated = parsedOut as Record<string, unknown>;
    const en = translated.en as Record<string, unknown> | undefined;
    const pl = translated.pl as Record<string, unknown> | undefined;
    if (!en || !pl || typeof en !== "object" || typeof pl !== "object") {
      res.status(502).json({ error: "Translation response must include en/pl objects" });
      return;
    }
    for (const field of fields) {
      if (typeof en[field] !== "string" || typeof pl[field] !== "string") {
        res.status(502).json({ error: `Invalid translated field: ${field}` });
        return;
      }
    }

    res.json({
      en: Object.fromEntries(fields.map((f) => [f, String(en[f])])) as Record<string, string>,
      pl: Object.fromEntries(fields.map((f) => [f, String(pl[f])])) as Record<string, string>
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
