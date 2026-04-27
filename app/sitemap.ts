import type { MetadataRoute } from "next";

import { getMarketingDictionary } from "@/i18n/marketing";
import { getMarketingSiteUrl } from "@/lib/sites";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getMarketingSiteUrl();
  const lastModified = new Date();

  const locales = ["fr", "nl", "en"] as const;
  const seoPageKeys = ["eventBriefingTemplate", "briefingGenerator"] as const;

  const homePages = locales.map((locale) => ({
    url: `${base}/${locale}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: locale === "fr" ? 1.0 : 0.9,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}`]))
    }
  }));

  const seoPages = seoPageKeys.flatMap((pageKey) =>
    locales.map((locale) => {
      const slug = getMarketingDictionary(locale).seoPages[pageKey].slug;

      return {
        url: `${base}/${locale}/${slug}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.82,
        alternates: {
          languages: Object.fromEntries(
            locales.map((entry) => {
              const localizedSlug = getMarketingDictionary(entry).seoPages[pageKey].slug;
              return [entry, `${base}/${entry}/${localizedSlug}`];
            })
          )
        }
      };
    })
  );

  return [...homePages, ...seoPages];
}
