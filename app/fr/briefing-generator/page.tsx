import { generateSeoMarketingMetadata } from "@/marketing/seoMetadata";
import { SeoMarketingPage } from "@/marketing/SeoMarketingPage";

export const generateMetadata = () => generateSeoMarketingMetadata("fr", "briefingGenerator");

export default function FrenchBriefingGeneratorPage() {
  return <SeoMarketingPage locale="fr" pageKey="briefingGenerator" />;
}
