import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import pl from "./locales/pl.json";
import be from "./locales/be.json";

const SUPPORTED_LANGS = ["en", "pl", "be"] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = "walacugi.lang";
const URL_PARAM = "lang";

function normalizeLang(raw: string | null): SupportedLang | null {
  if (!raw) return null;
  const base = raw.toLowerCase().split("-")[0];
  return SUPPORTED_LANGS.includes(base as SupportedLang) ? (base as SupportedLang) : null;
}

function resolveBrowserLang(): SupportedLang {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  const normalized = candidates.map((candidate) => normalizeLang(candidate)).filter(Boolean) as SupportedLang[];
  if (normalized.includes("pl")) return "pl";
  if (normalized.some((lang) => lang === "be")) return "be";

  const rawCodes = candidates.map((candidate) => candidate.toLowerCase().split("-")[0]);
  if (rawCodes.some((code) => code === "uk" || code === "ru")) return "be";

  return "en";
}

function getUrlLang(): SupportedLang | null {
  const params = new URLSearchParams(window.location.search);
  return normalizeLang(params.get(URL_PARAM));
}

function setUrlLang(lang: SupportedLang) {
  const url = new URL(window.location.href);
  if (url.searchParams.get(URL_PARAM) === lang) return;
  url.searchParams.set(URL_PARAM, lang);
  window.history.replaceState(window.history.state, "", url.toString());
}

function resolveInitialLang(): SupportedLang {
  const fromUrl = getUrlLang();
  if (fromUrl) return fromUrl;

  const fromStorage = normalizeLang(window.localStorage.getItem(STORAGE_KEY));
  if (fromStorage) return fromStorage;

  return resolveBrowserLang();
}

const initialLang = resolveInitialLang();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl },
    be: { translation: be }
  },
  lng: initialLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

i18n.on("languageChanged", (lang) => {
  const normalized = normalizeLang(lang) ?? "en";
  window.localStorage.setItem(STORAGE_KEY, normalized);
  document.documentElement.lang = normalized;
  setUrlLang(normalized);
});

// Keep language and URL in sync during client-side navigation.
window.addEventListener("popstate", () => {
  const urlLang = getUrlLang();
  if (urlLang && i18n.language !== urlLang) {
    void i18n.changeLanguage(urlLang);
    return;
  }
  if (!urlLang) {
    setUrlLang(normalizeLang(i18n.language) ?? "en");
  }
});

setUrlLang(initialLang);
document.documentElement.lang = initialLang;

export default i18n;
