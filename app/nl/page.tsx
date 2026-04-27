import type { Metadata } from "next";

import { getMarketingDictionary } from "@/i18n/marketing";
import { getMarketingSiteUrl } from "@/lib/sites";
import { LandingPage } from "@/marketing/LandingPage";

export function generateMetadata(): Metadata {
  const dictionary = getMarketingDictionary("nl");
  const base = getMarketingSiteUrl();

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    alternates: {
      canonical: `${base}/nl`,
      languages: {
        fr: `${base}/fr`,
        nl: `${base}/nl`,
        en: `${base}/en`
      }
    }
  };
}

export default function DutchMarketingPage() {
  return <LandingPage locale="nl" />;
}
