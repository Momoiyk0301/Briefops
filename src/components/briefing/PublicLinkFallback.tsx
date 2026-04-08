import { PUBLIC_LINK_INVALID_MESSAGE } from "@/supabase/queries/publicLinks";

export function PublicLinkFallback() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-[28px] border border-[#dfe6f2] bg-white/95 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <h1 className="text-lg font-semibold text-slate-900">Lien invalide</h1>
        <p className="mt-2 text-sm text-slate-600">{PUBLIC_LINK_INVALID_MESSAGE}</p>
      </div>
    </main>
  );
}
