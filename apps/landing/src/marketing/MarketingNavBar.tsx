"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import type { MarketingLocale } from "@/i18n/marketing";
import { marketingLocales } from "@/i18n/marketing";

type Props = {
  locale: MarketingLocale;
  nav: { solution: string; howItWorks: string; login: string; cta: string };
};

export function MarketingNavBar({ locale, nav }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="page-wrap">
        <div className="nav-inner">

          {/* Logo */}
          <a className="nav-logo" href={`/${locale}`}>
            <div className="nav-logo-mark">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18 }}>
                <path d="M8 14.5C8 14.5 8.8 17.5 12 17.5C15.2 17.5 16 14.5 16 14.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M8 10L8 6.5C8 5.1 9.1 4 10.5 4L13.5 4C14.9 4 16 5.1 16 6.5L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="6" y="10" width="12" height="7" rx="2" stroke="white" strokeWidth="1.6" />
              </svg>
            </div>
            <span className="nav-brand">BriefOPS</span>
          </a>

          {/* Nav links */}
          <nav className="nav-links" aria-label="Navigation principale">
            <a href={`/${locale}#solution`}>{nav.solution}</a>
            <a href={`/${locale}#how-it-works`}>{nav.howItWorks}</a>

            <select
              className="lang-select"
              value={locale}
              onChange={(e) => { window.location.href = `/${e.target.value}`; }}
              aria-label="Langue"
            >
              {marketingLocales.map((l) => (
                <option key={l} value={l}>{l === "fr" ? "Français" : l === "nl" ? "Nederlands" : "English"}</option>
              ))}
            </select>
          </nav>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn-waitlist-nav" onClick={() => { document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" }); }}>
              {nav.cta}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={open}
              style={{ display: "none" }}
              className="mobile-menu-btn"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)", padding: "16px 24px" }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <a href={`/${locale}#solution`} style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)", textDecoration: "none" }} onClick={() => setOpen(false)}>{nav.solution}</a>
            <a href={`/${locale}#how-it-works`} style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-2)", textDecoration: "none" }} onClick={() => setOpen(false)}>{nav.howItWorks}</a>
            <div style={{ display: "flex", gap: 8 }}>
              {marketingLocales.map((entry) => (
                <a key={entry} href={`/${entry}`} style={{ fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: entry === locale ? "var(--accent)" : "var(--ink-3)", textDecoration: "none" }}>{entry}</a>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
