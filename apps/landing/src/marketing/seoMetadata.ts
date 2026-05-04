import type { Metadata } from "next";

import type { MarketingLocale } from "@/i18n/marketing";
import { getMarketingDictionary, marketingLocales } from "@/i18n/marketing";
import { getMarketingSiteUrl } from "@shared/sites";

export type SeoPageKey = "eventBriefingTemplate" | "briefingGenerator";

export function generateSeoMarketingMetadata(locale: MarketingLocale, pageKey: SeoPageKey): Metadata {
  const dictionary = getMarketingDictionary(locale);
  const page = dictionary.seoPages[pageKey];
  const base = getMarketingSiteUrl();

  return {
    title: page.meta.title,
    description: page.meta.description,
    alternates: {
      canonical: `${base}/${locale}/${page.slug}`,
      languages: {
        "x-default": `${base}/${locale}/${page.slug}`,
        ...Object.fromEntries(
          marketingLocales.map((entry) => [
            entry,
            `${base}/${entry}/${getMarketingDictionary(entry).seoPages[pageKey].slug}`
          ])
        )
      }
    }
  };
}
