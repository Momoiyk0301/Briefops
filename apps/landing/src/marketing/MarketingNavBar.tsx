"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import type { MarketingLocale } from "@/i18n/marketing";
import { marketingLocales } from "@/i18n/marketing";

type Props = {
  locale: MarketingLocale;
  nav: {
    solution: string;
    howItWorks: string;
    login: string;
    cta: string;
  };
};

export function MarketingNavBar({ locale, nav }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#e4ecf9]/70 bg-white/90 shadow-[0_2px_16px_rgba(15,23,42,0.06)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6 lg:px-10 xl:px-12">

        {/* Logo — left */}
        <a href={`/${locale}`} className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#2b65ff_0%,#55b4ff_100%)] text-sm font-bold text-white shadow-[0_8px_20px_rgba(43,101,255,0.22)]">
            B
          </div>
          <span className="text-sm font-semibold tracking-wide text-[#10203a]">BriefOPS</span>
        </a>

        {/* Nav — center (desktop only) */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
          <a
            href={`/${locale}#solution`}
            className="text-sm font-medium text-[#4a5a78] transition hover:text-[#10203a]"
          >
            {nav.solution}
          </a>
          <a
            href={`/${locale}#how-it-works`}
            className="text-sm font-medium text-[#4a5a78] transition hover:text-[#10203a]"
          >
            {nav.howItWorks}
          </a>

          {/* Locale switcher */}
          <div className="flex items-center gap-0.5 rounded-full border border-[#d6def1] bg-white px-2 py-1">
            {marketingLocales.map((entry) => (
              <a
                key={entry}
                href={`/${entry}`}
                className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase transition ${
                  entry === locale
                    ? "bg-[#e9f0ff] text-[#1d4ed8]"
                    : "text-[#6a7b9b] hover:text-[#10203a]"
                }`}
              >
                {entry}
              </a>
            ))}
          </div>
        </nav>

        {/* CTA — right */}
        <div className="flex items-center gap-2">
          <span
            aria-disabled="true"
            className="hidden cursor-not-allowed rounded-full border border-[#d6def1] px-4 py-2 text-sm font-medium text-[#28436b] opacity-50 sm:inline-flex"
          >
            Bientôt disponible
          </span>
          <span
            aria-disabled="true"
            className="cursor-not-allowed rounded-full bg-[#2b65ff] px-4 py-2 text-sm font-semibold text-white opacity-60 shadow-[0_8px_20px_rgba(43,101,255,0.22)]"
          >
            Bientôt disponible
          </span>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            className="ml-1 rounded-xl border border-[#d6def1] p-2 text-[#4a5a78] transition hover:bg-[#f0f4ff] md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <div className="border-t border-[#e8eef8] bg-white/98 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Navigation mobile">
            <a
              href={`/${locale}#solution`}
              className="text-sm font-medium text-[#4a5a78]"
              onClick={() => setOpen(false)}
            >
              {nav.solution}
            </a>
            <a
              href={`/${locale}#how-it-works`}
              className="text-sm font-medium text-[#4a5a78]"
              onClick={() => setOpen(false)}
            >
              {nav.howItWorks}
            </a>
            <span aria-disabled="true" className="cursor-not-allowed text-sm font-medium text-[#28436b] opacity-55">
              Bientôt disponible
            </span>
            <div className="flex items-center gap-1 pt-1">
              {marketingLocales.map((entry) => (
                <a
                  key={entry}
                  href={`/${entry}`}
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                    entry === locale ? "bg-[#e9f0ff] text-[#1d4ed8]" : "text-[#6a7b9b]"
                  }`}
                >
                  {entry}
                </a>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
