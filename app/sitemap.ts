import type { MetadataRoute } from "next";

import { getMarketingSiteUrl } from "@/lib/sites";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getMarketingSiteUrl();
  const lastModified = new Date();

  const locales = ["fr", "nl", "en"] as const;

  return locales.map((locale) => ({
    url: `${base}/${locale}`,
    lastModified,
    changeFrequency: "weekly",
    priority: locale === "fr" ? 1.0 : 0.9,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}`]))
    }
  }));
}
