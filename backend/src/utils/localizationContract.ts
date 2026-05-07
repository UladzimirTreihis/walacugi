export const SUPPORTED_LANGS = ["en", "be", "pl"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_SOURCE_LANG: SupportedLang = "be";

export type LocalizedText = Record<SupportedLang, string>;

export const EMPTY_LOCALIZED_TEXT: LocalizedText = {
  en: "",
  be: "",
  pl: ""
};
