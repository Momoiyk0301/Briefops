import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { isAppLocale } from "@/i18n/config";
import { appI18nResources } from "@/i18n/resources";

const saved = typeof window !== "undefined" ? window.localStorage.getItem("briefops:lang") : null;
const initialLng = saved && isAppLocale(saved) ? saved : "fr";

void i18n.use(initReactI18next).init({
  resources: appI18nResources,
  lng: initialLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

void i18n.on("languageChanged", (language) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
  if (typeof window !== "undefined" && isAppLocale(language)) {
    window.localStorage.setItem("briefops:lang", language);
  }
});

export default i18n;
