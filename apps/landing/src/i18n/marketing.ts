import frDict from "./locales/fr.json";
import nlDict from "./locales/nl.json";
import enDict from "./locales/en.json";

export const marketingLocales = ["fr", "nl", "en"] as const;

export type MarketingLocale = (typeof marketingLocales)[number];

export function isMarketingLocale(value: string): value is MarketingLocale {
  return marketingLocales.includes(value as MarketingLocale);
}

export function detectMarketingLocale(acceptLanguage: string | null | undefined): MarketingLocale {
  const languages = String(acceptLanguage ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase().split(";")[0]?.split("-")[0] ?? "")
    .filter(Boolean);

  for (const language of languages) {
    if (isMarketingLocale(language)) {
      return language;
    }
  }

  return "en";
}

type MarketingDictionary = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    product: string;
    solution: string;
    howItWorks: string;
    login: string;
    cta: string;
  };
  problem: {
    label: string;
    text: string;
  };
  hero: {
    kicker: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    bullets: string[];
  };
  sections: {
    clarity: { title: string; description: string };
    speed: { title: string; description: string };
    sharing: { title: string; description: string };
  };
  featuresSectionTitle: string;
  features: Array<{ title: string; description: string }>;
  workflow: {
    title: string;
    steps: Array<{ title: string; description: string }>;
  };
  seoPages: {
    eventBriefingTemplate: SeoPageDictionary;
    briefingGenerator: SeoPageDictionary;
  };
  footer: {
    marketing: string;
    app: string;
    language: string;
  };
};

type SeoPageDictionary = {
  slug: string;
  meta: {
    title: string;
    description: string;
  };
  navLabel: string;
  hero: {
    kicker: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  sections: Array<{ title: string; description: string }>;
  checklistTitle: string;
  checklist: string[];
  finalCta: {
    title: string;
    description: string;
    button: string;
  };
};

const dictionaries: Record<MarketingLocale, MarketingDictionary> = {
  fr: frDict as MarketingDictionary,
  nl: nlDict as MarketingDictionary,
  en: enDict as MarketingDictionary,
};

export function getMarketingDictionary(locale: MarketingLocale) {
  return dictionaries[locale];
}
