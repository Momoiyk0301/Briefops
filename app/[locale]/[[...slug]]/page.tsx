import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMarketingDictionary, isMarketingLocale } from "@/i18n/marketing";
import { LandingPage } from "@/marketing/LandingPage";

type MarketingPageProps = {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
};

export async function generateMetadata({ params }: MarketingPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isMarketingLocale(locale)) {
    return {};
  }

  const dictionary = getMarketingDictionary(locale);
  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description
  };
}

export default async function MarketingPage({ params }: MarketingPageProps) {
  const { locale, slug = [] } = await params;

  if (!isMarketingLocale(locale)) {
    notFound();
  }

  if (slug.length > 0) {
    notFound();
  }

  return <LandingPage locale={locale} />;
}
