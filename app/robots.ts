import type { MetadataRoute } from "next";

import { getMarketingSiteUrl } from "@/lib/sites";

export default function robots(): MetadataRoute.Robots {
  const base = getMarketingSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/briefings/s/", "/briefings/*/"]
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}
