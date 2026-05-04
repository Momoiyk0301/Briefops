import type { Metadata } from "next";
import { WaitlistForm } from "@/marketing/WaitlistForm";

export const metadata: Metadata = {
  title: "Rejoindre la waitlist — BriefOPS",
  description: "Inscris-toi sur la waitlist BriefOPS et sois parmi les premiers à accéder à la beta.",
  robots: { index: true, follow: true }
};

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#0b1525]">
      <header className="border-b border-[#e2e8f4] bg-white">
        <div className="mx-auto flex h-14 max-w-[900px] items-center justify-between px-6">
          <a href="/" className="text-sm font-bold tracking-tight text-[#0b1525]">BriefOPS</a>
          <a href="/" className="flex items-center gap-1.5 text-xs text-[#64748b] transition hover:text-[#0b1525]">
            ← Retour
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[600px] px-6 py-20 pb-24 text-center">
        <span className="mb-4 inline-block text-[10px] font-medium uppercase tracking-[0.14em] text-[oklch(49%_0.22_258)]">
          Accès anticipé
        </span>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          La beta arrive bientôt.
        </h1>
        <p className="mb-3 text-base leading-relaxed text-[#2d3f58]">
          BriefOPS est en cours de finalisation. Inscris-toi sur la waitlist et tu recevras un email dès que la beta est ouverte — avec un accès prioritaire.
        </p>
        <p className="mb-10 text-sm text-[#64748b]">
          Aucun engagement · Aucune carte bancaire · Accès anticipé gratuit
        </p>

        <div className="flex justify-center">
          <WaitlistForm source="waitlist-page" />
        </div>
      </main>

      <footer className="border-t border-[#e2e8f4] py-5 text-center font-mono text-xs text-[#64748b]">
        BriefOPS ·{" "}
        <a href="/" className="mx-2 text-[#64748b] hover:text-[#0b1525]">Accueil</a>
        <a href="/cgu" className="mx-2 text-[#64748b] hover:text-[#0b1525]">CGU</a>
        <a href="/privacy" className="mx-2 text-[#64748b] hover:text-[#0b1525]">Confidentialité</a>
      </footer>
    </div>
  );
}
