import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";

const saved = localStorage.getItem("briefops:lang");
const initialLng = saved === "fr" || saved === "en" ? saved : "fr";

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en }
  },
  lng: initialLng,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
