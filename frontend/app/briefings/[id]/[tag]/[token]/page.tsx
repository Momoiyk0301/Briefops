import * as Sentry from "@sentry/nextjs";

import { PublicBriefingErrorBoundary } from "@/components/briefing/PublicBriefingErrorBoundary";
import { PublicLinkFallback } from "@/components/briefing/PublicLinkFallback";
import { PublicBriefingView } from "@/components/briefing/PublicBriefingView";
import { buildPublicBriefingHeader, buildPublicBriefingSections } from "@/lib/publicBriefings";
import { resolveAudienceBriefingByToken } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient } from "@/supabase/server";

type Props = {
  params: Promise<{ id: string; tag: string; token: string }>;
};

export default async function AudienceBriefingPage({ params }: Props) {
  const resolvedParams = await params;

  try {
    const { id, tag, token } = resolvedParams;
    const service = createServiceRoleClient();
    const resolved = await resolveAudienceBriefingByToken(service, id, tag, token);

    if (!resolved) return <PublicLinkFallback />;

    const header = buildPublicBriefingHeader(resolved.briefing);
    const sections = buildPublicBriefingSections(resolved.modules, resolved.audienceTag);

    return (
      <PublicBriefingErrorBoundary area="public-briefing" tokenPresent={Boolean(token)}>
        <PublicBriefingView
          title={header.title}
          date={header.date}
          location={header.location}
          audienceLabel={resolved.audienceTag}
          sections={sections}
        />
      </PublicBriefingErrorBoundary>
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "public-briefing", view: "audience" },
      extra: {
        tokenPresent: Boolean(resolvedParams.token),
        briefingId: resolvedParams.id,
        audienceTag: resolvedParams.tag,
        pathTemplate: "/briefings/[id]/[tag]/[token]"
      }
    });
    return <PublicLinkFallback />;
  }
}
