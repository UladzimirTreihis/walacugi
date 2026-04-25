export const LANG_PARAM = "lang";
export const SUPPORTED_LANGS = ["be", "en", "pl"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export function normalizeLang(raw: string | null | undefined): SupportedLang | null {
  if (!raw) return null;
  const base = raw.toLowerCase().split("-")[0];
  return SUPPORTED_LANGS.includes(base as SupportedLang) ? (base as SupportedLang) : null;
}

export function currentLangFromUrl(search: string = window.location.search): SupportedLang | null {
  const params = new URLSearchParams(search);
  return normalizeLang(params.get(LANG_PARAM));
}

export function addLangToPath(path: string, lang: string): string {
  const normalized = normalizeLang(lang) ?? "be";
  const url = new URL(path, window.location.origin);
  url.searchParams.set(LANG_PARAM, normalized);
  return `${url.pathname}${url.search}${url.hash}`;
}
