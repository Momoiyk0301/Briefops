import { PublicBriefingView } from "@/components/briefing/PublicBriefingView";
import { buildPublicBriefingHeader, buildPublicBriefingSections } from "@/lib/publicBriefings";
import { PUBLIC_LINK_INVALID_MESSAGE, resolveAudienceBriefingByToken } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient } from "@/supabase/server";

type Props = {
  params: Promise<{ id: string; tag: string; token: string }>;
};

export default async function AudienceBriefingPage({ params }: Props) {
  const { id, tag, token } = await params;
  const service = createServiceRoleClient();
  const resolved = await resolveAudienceBriefingByToken(service, id, tag, token);

  if (!resolved) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-[28px] border border-[#dfe6f2] bg-white/95 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <h1 className="text-lg font-semibold text-slate-900">Lien invalide</h1>
          <p className="mt-2 text-sm text-slate-600">{PUBLIC_LINK_INVALID_MESSAGE}</p>
        </div>
      </main>
    );
  }

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
}
