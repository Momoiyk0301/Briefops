import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en.json";
import fr from "@/i18n/locales/fr.json";

const resources = {
  fr: { translation: fr },
  en: { translation: en }
} as const;

const saved = typeof window !== "undefined" ? window.localStorage.getItem("briefops:lang") : null;
const initialLng = saved === "fr" || saved === "en" ? saved : "fr";

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

void i18n.on("languageChanged", (language) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
  if (typeof window !== "undefined" && (language === "fr" || language === "en")) {
    window.localStorage.setItem("briefops:lang", language);
  }
});

export default i18n;
