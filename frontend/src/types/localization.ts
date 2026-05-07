export const LOCALES = ["be", "en", "pl"] as const;
export type Locale = (typeof LOCALES)[number];
export type LocalizedText = Record<Locale, string>;

export const EMPTY_LOCALIZED: LocalizedText = {
  be: "",
  en: "",
  pl: ""
};
