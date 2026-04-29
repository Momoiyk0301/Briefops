import { generateSeoMarketingMetadata } from "@/marketing/seoMetadata";
import { SeoMarketingPage } from "@/marketing/SeoMarketingPage";

export const generateMetadata = () => generateSeoMarketingMetadata("en", "eventBriefingTemplate");

export default function EnglishEventBriefingTemplatePage() {
  return <SeoMarketingPage locale="en" pageKey="eventBriefingTemplate" />;
}
