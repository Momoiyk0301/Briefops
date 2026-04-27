import * as Sentry from "@sentry/nextjs";

import { PublicBriefingErrorBoundary } from "@/components/briefing/PublicBriefingErrorBoundary";
import { PublicLinkFallback } from "@/components/briefing/PublicLinkFallback";
import { PublicBriefingView } from "@/components/briefing/PublicBriefingView";
import { buildPublicBriefingHeader, buildPublicBriefingSections } from "@/lib/publicBriefings";
import { resolveStaffBriefingByToken } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient } from "@/supabase/server";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function StaffBriefingPage({ params }: Props) {
  try {
    const { token } = await params;
    const service = createServiceRoleClient();
    const resolved = await resolveStaffBriefingByToken(service, token);

    if (!resolved) return <PublicLinkFallback />;

    const header = buildPublicBriefingHeader(resolved.briefing);
    const sections = buildPublicBriefingSections(resolved.modules);

    return (
      <PublicBriefingErrorBoundary area="public-briefing" tokenPresent={Boolean(token)}>
        <PublicBriefingView title={header.title} date={header.date} location={header.location} sections={sections} updatedAt={header.updatedAt} />
      </PublicBriefingErrorBoundary>
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "public-briefing", view: "staff" },
      extra: { tokenPresent: true, pathTemplate: "/briefings/s/[token]" }
    });
    return <PublicLinkFallback />;
  }
}
