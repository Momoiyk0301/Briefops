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
    <header
      className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--border)]"
      style={{ background: "rgba(247,249,252,0.92)", backdropFilter: "blur(16px)" }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-12 py-0" style={{ height: "60px" }}>

        {/* Logo */}
        <a href={`/${locale}`} className="flex shrink-0 items-center gap-2.5 text-[var(--ink)] no-underline">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)]"
            style={{
              background: "oklch(49% 0.22 258)",
              boxShadow: "0 4px 12px oklch(49% 0.22 258 / 0.28)"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.4" />
            </svg>
          </div>
          <span className="font-display text-[15px] font-bold tracking-[-0.02em]">BriefOPS</span>
        </a>

        {/* Nav links */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          <a
            href={`/${locale}#solution`}
            className="text-[13.5px] font-medium text-[var(--ink-2)] no-underline transition-colors hover:text-[var(--ink)]"
          >
            {nav.solution}
          </a>
          <a
            href={`/${locale}#how-it-works`}
            className="text-[13.5px] font-medium text-[var(--ink-2)] no-underline transition-colors hover:text-[var(--ink)]"
          >
            {nav.howItWorks}
          </a>

          {/* Locale */}
          <select
            onChange={(e) => { window.location.href = `/${e.target.value}`; }}
            value={locale}
            className="cursor-pointer appearance-none rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--bg-2)] px-2 py-1 pr-6 font-mono text-[11px] font-medium text-[var(--ink-2)] outline-none transition hover:border-[var(--border-2)] focus:border-[oklch(49%_0.22_258)]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center"
            }}
          >
            {marketingLocales.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
        </nav>

        {/* CTA */}
        <div className="hidden items-center gap-2 md:flex">
          <a
            href={`/${locale}/login`}
            className="rounded-[var(--r-md)] border border-[var(--border)] px-4 py-2 text-[13px] font-medium text-[var(--ink-2)] no-underline transition hover:border-[var(--border-2)] hover:text-[var(--ink)]"
          >
            {nav.login}
          </a>
          <a
            href="#waitlist"
            className="flex items-center gap-1.5 rounded-[var(--r-md)] px-4 py-2 text-[13px] font-semibold text-white no-underline transition hover:-translate-y-px hover:bg-[var(--accent-h)]"
            style={{ background: "oklch(49% 0.22 258)" }}
          >
            {nav.cta}
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          className="ml-1 rounded-lg border border-[var(--border)] p-2 text-[var(--ink-2)] transition hover:bg-[var(--bg-3)] md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-2)] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Navigation mobile">
            <a
              href={`/${locale}#solution`}
              className="text-sm font-medium text-[var(--ink-2)] no-underline"
              onClick={() => setOpen(false)}
            >
              {nav.solution}
            </a>
            <a
              href={`/${locale}#how-it-works`}
              className="text-sm font-medium text-[var(--ink-2)] no-underline"
              onClick={() => setOpen(false)}
            >
              {nav.howItWorks}
            </a>
            <a
              href={`/${locale}/login`}
              className="text-sm font-medium text-[var(--ink-2)] no-underline"
              onClick={() => setOpen(false)}
            >
              {nav.login}
            </a>
            <div className="flex items-center gap-2 pt-1">
              {marketingLocales.map((entry) => (
                <a
                  key={entry}
                  href={`/${entry}`}
                  className={`rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase no-underline ${
                    entry === locale
                      ? "bg-[oklch(92%_0.08_258)] text-[oklch(49%_0.22_258)]"
                      : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                  }`}
                >
                  {entry}
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
