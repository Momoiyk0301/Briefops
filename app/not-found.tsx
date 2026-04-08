import { buildAppUrl, buildMarketingUrl } from "@/lib/sites";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7fbff_0%,#eef4ff_48%,#fff7ef_100%)] px-6 py-10">
      <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.1)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6680aa]">BriefOPS</p>
        <h1 className="mt-4 text-3xl font-semibold text-[#10203a]">Page introuvable</h1>
        <p className="mt-3 text-sm leading-7 text-[#576781]">
          Le contenu demandé n’existe pas ou n’est plus disponible. Tu peux revenir vers la landing ou ouvrir directement l’application.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="rounded-full bg-[#10203a] px-5 py-3 text-sm font-semibold text-white"
            href={buildMarketingUrl("/fr")}
          >
            Retour au site
          </a>
          <a
            className="rounded-full border border-[#d4deef] bg-white px-5 py-3 text-sm font-medium text-[#29436c]"
            href={buildAppUrl("/login")}
          >
            Ouvrir l’app
          </a>
        </div>
      </div>
    </main>
  );
}
