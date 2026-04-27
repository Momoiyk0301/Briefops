import type { Metadata } from "next";

import { getMarketingDictionary } from "@/i18n/marketing";
import { LandingPage } from "@/marketing/LandingPage";

export function generateMetadata(): Metadata {
  const dictionary = getMarketingDictionary("fr");

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description
  };
}

export default function FrenchMarketingPage() {
  return <LandingPage locale="fr" />;
}
