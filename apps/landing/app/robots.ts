import type { MetadataRoute } from "next";

import { getMarketingSiteUrl } from "@shared/sites";

export default function robots(): MetadataRoute.Robots {
  const base = getMarketingSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/en/", "/fr/", "/nl/", "/cgu", "/privacy", "/mentions-legales", "/cookies"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/briefings/",
          "/auth/",
          "/login",
          "/onboarding",
          "/account",
          "/settings",
          "/staff",
          "/modules",
          "/documents",
          "/status"
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
