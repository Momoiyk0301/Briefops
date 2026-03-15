import * as Sentry from "@sentry/nextjs";

import { PublicLinkFallback } from "@/components/briefing/PublicLinkFallback";
import { PublicBriefingView } from "@/components/briefing/PublicBriefingView";
import { buildPublicBriefingHeader, buildPublicBriefingSections } from "@/lib/publicBriefings";
import { resolveAudienceBriefingByToken } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient } from "@/supabase/server";

type Props = {
  params: Promise<{ id: string; tag: string; token: string }>;
};

export default async function AudienceBriefingPage({ params }: Props) {
  try {
    const { id, tag, token } = await params;
    const service = createServiceRoleClient();
    const resolved = await resolveAudienceBriefingByToken(service, id, tag, token);

    if (!resolved) return <PublicLinkFallback />;

    const header = buildPublicBriefingHeader(resolved.briefing);
    const sections = buildPublicBriefingSections(resolved.modules, resolved.audienceTag);

    return (
      <PublicBriefingView
        title={header.title}
        date={header.date}
        location={header.location}
        audienceLabel={resolved.audienceTag}
        sections={sections}
      />
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "public-briefing", view: "audience" }
    });
    return <PublicLinkFallback />;
  }
}
