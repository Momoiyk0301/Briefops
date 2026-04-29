import { generateSeoMarketingMetadata } from "@/marketing/seoMetadata";
import { SeoMarketingPage } from "@/marketing/SeoMarketingPage";

export const generateMetadata = () => generateSeoMarketingMetadata("nl", "eventBriefingTemplate");

export default function DutchEventBriefingTemplatePage() {
  return <SeoMarketingPage locale="nl" pageKey="eventBriefingTemplate" />;
}
