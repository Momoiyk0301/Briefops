import type { Metadata } from "next";

import { getMarketingDictionary } from "@/i18n/marketing";
import { LandingPage } from "@/marketing/LandingPage";

export function generateMetadata(): Metadata {
  const dictionary = getMarketingDictionary("nl");

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description
  };
}

export default function DutchMarketingPage() {
  return <LandingPage locale="nl" />;
}
