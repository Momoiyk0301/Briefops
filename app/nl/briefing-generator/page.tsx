import { generateSeoMarketingMetadata } from "@/marketing/seoMetadata";
import { SeoMarketingPage } from "@/marketing/SeoMarketingPage";

export const generateMetadata = () => generateSeoMarketingMetadata("nl", "briefingGenerator");

export default function DutchBriefingGeneratorPage() {
  return <SeoMarketingPage locale="nl" pageKey="briefingGenerator" />;
}
