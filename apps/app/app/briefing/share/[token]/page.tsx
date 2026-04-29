import * as Sentry from "@sentry/nextjs";

import { PublicBriefingErrorBoundary } from "@/components/briefing/PublicBriefingErrorBoundary";
import { PublicLinkFallback } from "@/components/briefing/PublicLinkFallback";
import { PublicBriefingView } from "@/components/briefing/PublicBriefingView";
import { buildPublicBriefingHeader, buildPublicBriefingSections } from "@/lib/publicBriefings";
import { incrementViewsCount, resolvePublicLinkByToken } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient } from "@/supabase/server";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharedBriefingPage({ params }: Props) {
  const { token } = await params;

  try {
    const service = createServiceRoleClient();
    const resolved = await resolvePublicLinkByToken(service, token);

    if (!resolved) return <PublicLinkFallback />;

    await incrementViewsCount(service, resolved.link.id);

    const header = buildPublicBriefingHeader(resolved.briefing);
    const sections = buildPublicBriefingSections(resolved.modules, resolved.audienceTag);

    return (
      <PublicBriefingErrorBoundary area="public_share" tokenPresent={Boolean(token)}>
        <PublicBriefingView
          title={header.title}
          date={header.date}
          location={header.location}
          audienceLabel={resolved.audienceTag}
          sections={sections}
          updatedAt={header.updatedAt}
        />
      </PublicBriefingErrorBoundary>
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "public-briefing", view: "unified" },
      extra: { tokenPresent: Boolean(token), pathTemplate: "/briefing/share/[token]" }
    });
    return <PublicLinkFallback />;
  }
}
