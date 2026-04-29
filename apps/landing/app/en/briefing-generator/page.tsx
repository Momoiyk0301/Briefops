import { generateSeoMarketingMetadata } from "@/marketing/seoMetadata";
import { SeoMarketingPage } from "@/marketing/SeoMarketingPage";

export const generateMetadata = () => generateSeoMarketingMetadata("en", "briefingGenerator");

export default function EnglishBriefingGeneratorPage() {
  return <SeoMarketingPage locale="en" pageKey="briefingGenerator" />;
}
