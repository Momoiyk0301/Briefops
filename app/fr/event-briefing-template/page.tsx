import { generateSeoMarketingMetadata } from "@/marketing/seoMetadata";
import { SeoMarketingPage } from "@/marketing/SeoMarketingPage";

export const generateMetadata = () => generateSeoMarketingMetadata("fr", "eventBriefingTemplate");

export default function FrenchEventBriefingTemplatePage() {
  return <SeoMarketingPage locale="fr" pageKey="eventBriefingTemplate" />;
}
