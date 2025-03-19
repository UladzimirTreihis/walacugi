import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import en from "./locales/en.json";
import pl from "./locales/pl.json";
// import ru from "./locales/ru.json";
// import be from "./locales/be.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pl: { translation: pl }
  },
  lng: "en", // Default language
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
