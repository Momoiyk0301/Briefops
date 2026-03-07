import { redirect } from "next/navigation";

import { PUBLIC_LINK_INVALID_MESSAGE, getActivePublicLinkWithPdfPath } from "@/supabase/queries/publicLinks";
import { createServiceRoleClient } from "@/supabase/server";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PublicSharePage({ params }: Props) {
  const { token } = await params;
  const service = createServiceRoleClient();
  const resolved = await getActivePublicLinkWithPdfPath(service, token);

  if (!resolved) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Share Link</h1>
          <p className="mt-2 text-sm text-slate-600">{PUBLIC_LINK_INVALID_MESSAGE}</p>
        </div>
      </main>
    );
  }

  const { data: signed, error } = await service.storage
    .from("exports")
    .createSignedUrl(resolved.pdfPath, 3600);

  if (error || !signed?.signedUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Share Link</h1>
          <p className="mt-2 text-sm text-slate-600">Unable to open this PDF right now. Please try again later.</p>
        </div>
      </main>
    );
  }

  redirect(signed.signedUrl);
}

