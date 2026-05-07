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
import { HttpError } from "../utils/httpErrors.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { loginLimiter } from "../utils/rateLimit.js";
import { clearAuthCookie, setAuthCookie } from "../utils/auth.js";
import { CSRF_COOKIE_NAME, generateCsrfToken } from "../utils/csrf.js";

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

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!password || !adminPasswordHash || !jwtSecret) {
      throw new HttpError(500, "Server misconfiguration");
    }

    const isMatch = await bcrypt.compare(password, adminPasswordHash);
    if (!isMatch) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = jwt.sign({ role: "admin" }, jwtSecret, { expiresIn: "24h" });
    setAuthCookie(res, token);
    res.json({ ok: true });
  })
);

router.post("/logout", checkAdminToken, (req: Request, res: Response) => {
  clearAuthCookie(res);
  res.clearCookie(CSRF_COOKIE_NAME, {
    sameSite: "none",
    secure: true,
    httpOnly: false,
    path: "/"
  });
  res.status(204).send();
});

router.get("/me", checkAdminToken, (_req: Request, res: Response) => {
  res.json({ isAdmin: true });
});

router.get("/csrf", checkAdminToken, (req: Request, res: Response) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

router.get(
  "/news/:id/localized",
  checkAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const item = await News.findById(req.params.id).lean();
    if (!item) {
      throw new HttpError(404, "Not found");
    }
    if (!isLocalizedText(item.title) || !isLocalizedText(item.description) || !isLocalizedText(item.location)) {
      throw new HttpError(500, "Invalid stored content");
    }
    res.json(item);
  })
);

router.get(
  "/events/:id/localized",
  checkAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const item = await Event.findById(req.params.id).lean();
    if (!item) {
      throw new HttpError(404, "Not found");
    }
    if (
      !isLocalizedText(item.title) ||
      !isLocalizedText(item.description) ||
      !isLocalizedText(item.location) ||
      !isLocalizedText(item.approxDate) ||
      !isLocalizedText(item.ageRestriction)
    ) {
      throw new HttpError(500, "Invalid stored content");
    }
    res.json(item);
  })
);

router.get(
  "/categories/localized",
  checkAdminToken,
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await Category.find().sort({ updatedAt: -1, createdAt: -1 }).lean();
    if (categories.some((item) => !isLocalizedText(item.name))) {
      throw new HttpError(500, "Invalid stored content");
    }
    res.json(categories);
  })
);

router.get(
  "/equipment/:id/localized",
  checkAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const model = await EquipmentModel.findById(req.params.id).populate("categories", "name").lean();
    if (!model) {
      throw new HttpError(404, "Not found");
    }
    if (!isLocalizedText(model.title) || !isLocalizedText(model.description) || !isLocalizedText(model.size)) {
      throw new HttpError(500, "Invalid stored content");
    }
    const units = await EquipmentUnit.find({ modelId: model._id }).sort({ unitNumber: 1 }).lean();
    res.json({ model, units });
  })
);

router.post(
  "/translate-localized",
  checkAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new HttpError(500, "Translation is not configured");
    }

    const parsed = validateTranslatePayload(req.body);
    if (!parsed) {
      throw new HttpError(400, "Invalid payload. Expected { entity, source }");
    }

    const fields = entityFields(parsed.entity);
    for (const field of fields) {
      if (typeof parsed.source[field] !== "string") {
        throw new HttpError(400, `Missing source field: ${field}`);
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
      throw new HttpError(502, "Translation request failed");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      throw new HttpError(502, "Empty translation response");
    }

    let parsedOut: unknown;
    try {
      parsedOut = JSON.parse(raw);
    } catch {
      throw new HttpError(502, "Invalid translation response");
    }

    if (!parsedOut || typeof parsedOut !== "object") {
      throw new HttpError(502, "Invalid translation response shape");
    }
    const translated = parsedOut as Record<string, unknown>;
    const en = translated.en as Record<string, unknown> | undefined;
    const pl = translated.pl as Record<string, unknown> | undefined;
    if (!en || !pl || typeof en !== "object" || typeof pl !== "object") {
      throw new HttpError(502, "Translation response must include en/pl objects");
    }
    for (const field of fields) {
      if (typeof en[field] !== "string" || typeof pl[field] !== "string") {
        throw new HttpError(502, `Invalid translated field: ${field}`);
      }
    }

    res.json({
      en: Object.fromEntries(fields.map((f) => [f, String(en[f])])) as Record<string, string>,
      pl: Object.fromEntries(fields.map((f) => [f, String(pl[f])])) as Record<string, string>
    });
  })
);

export default router;
