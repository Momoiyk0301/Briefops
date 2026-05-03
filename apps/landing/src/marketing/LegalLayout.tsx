type Props = {
  kicker: string;
  title: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalLayout({ kicker, title, updated, children }: Props) {
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

      <main className="mx-auto max-w-[760px] px-6 py-14 pb-24">
        <span className="mb-3 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#1d4ed8]">{kicker}</span>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mb-12 border-b border-[#e2e8f4] pb-6 font-mono text-xs text-[#64748b]">{updated}</p>
        <div className="prose-legal">{children}</div>
      </main>

      <footer className="border-t border-[#e2e8f4] py-5 text-center font-mono text-xs text-[#64748b]">
        BriefOPS ·{" "}
        <a href="/" className="mx-2 text-[#64748b] hover:text-[#0b1525]">Accueil</a>
        <a href="/cgu" className="mx-2 text-[#64748b] hover:text-[#0b1525]">CGU</a>
        <a href="/privacy" className="mx-2 text-[#64748b] hover:text-[#0b1525]">Confidentialité</a>
        <a href="/mentions-legales" className="mx-2 text-[#64748b] hover:text-[#0b1525]">Mentions légales</a>
        <a href="/cookies" className="mx-2 text-[#64748b] hover:text-[#0b1525]">Cookies</a>
      </footer>
    </div>
  );
}

export function L2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-10 text-lg font-bold tracking-tight text-[#0b1525]">{children}</h2>;
}

export function LP({ children }: { children: React.ReactNode }) {
  return <p className="mb-3.5 text-sm leading-[1.8] text-[#2d3f58]">{children}</p>;
}

export function LUl({ children }: { children: React.ReactNode }) {
  return <ul className="mb-3.5 list-disc pl-5 text-sm leading-[1.75] text-[#2d3f58]">{children}</ul>;
}

export function LHighlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 rounded-lg border border-[#e2e8f4] bg-[#f0f4fa] px-5 py-4 text-sm text-[#2d3f58]">
      {children}
    </div>
  );
}
