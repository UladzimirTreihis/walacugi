import { LOCALES, type Locale } from "../types/localization";

export const LANG_PARAM = "lang";

export function normalizeLang(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  const base = raw.toLowerCase().split("-")[0];
  return LOCALES.includes(base as Locale) ? (base as Locale) : null;
}

export function currentLangFromUrl(search: string = window.location.search): Locale | null {
  const params = new URLSearchParams(search);
  return normalizeLang(params.get(LANG_PARAM));
}

export function addLangToPath(path: string, lang: string): string {
  const normalized = normalizeLang(lang) ?? "be";
  const url = new URL(path, window.location.origin);
  url.searchParams.set(LANG_PARAM, normalized);
  return `${url.pathname}${url.search}${url.hash}`;
}
