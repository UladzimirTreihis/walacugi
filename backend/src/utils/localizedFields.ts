import type { Request } from "express";
import { SUPPORTED_LANGS, type SupportedLang, type LocalizedText } from "./localizationContract.js";
export type { LocalizedText } from "./localizationContract.js";

export function normalizeLang(raw: unknown): SupportedLang | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const base = raw.toLowerCase().split("-")[0];
  if (SUPPORTED_LANGS.includes(base as SupportedLang)) {
    return base as SupportedLang;
  }
  return null;
}

export function getRequestedLang(req: Request): SupportedLang {
  return normalizeLang(req.query.lang) ?? "be";
}

export function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return SUPPORTED_LANGS.every((lang) => typeof obj[lang] === "string");
}

export function getLocalizedText(value: LocalizedText, lang: SupportedLang): string {
  return value[lang];
}
