import * as Sentry from "@sentry/nextjs";

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

    return <PublicBriefingView title={header.title} date={header.date} location={header.location} sections={sections} />;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "public-briefing", view: "staff" }
    });
    return <PublicLinkFallback />;
  }
}
