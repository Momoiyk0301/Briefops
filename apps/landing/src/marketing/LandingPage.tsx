import { ArrowRight, FileText, Layers, Smartphone, Users, Zap, Clock, Shield } from "lucide-react";

import type { MarketingLocale } from "@/i18n/marketing";
import { getMarketingDictionary, marketingLocales } from "@/i18n/marketing";
import { LocaleHtmlSync } from "@/marketing/LocaleHtmlSync";
import { MarketingNavBar } from "@/marketing/MarketingNavBar";
import { WaitlistForm } from "@/marketing/WaitlistForm";

type LandingPageProps = {
  locale: MarketingLocale;
};

const featureIcons = [
  <FileText key="file" size={20} />,
  <Layers key="layers" size={20} />,
  <Users key="users" size={20} />,
  <Smartphone key="phone" size={20} />,
];

const workflowIcons = [
  <Zap key="zap" size={18} />,
  <Clock key="clock" size={18} />,
  <Shield key="shield" size={18} />,
];

export function LandingPage({ locale }: LandingPageProps) {
  const dictionary = getMarketingDictionary(locale);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--ink)]">
      <LocaleHtmlSync locale={locale} />

      <MarketingNavBar
        locale={locale}
        nav={{
          solution: dictionary.nav.solution,
          howItWorks: dictionary.nav.howItWorks,
          login: dictionary.nav.login,
          cta: dictionary.nav.cta
        }}
      />

      <main className="mx-auto max-w-[1280px] px-12 pb-0 pt-[60px]" style={{ fontFamily: "var(--font-body)" }}>

        {/* ── Hero ── */}
        <section
          aria-labelledby="hero-heading"
          className="grid items-center gap-[72px] py-20 lg:grid-cols-2"
        >
          {/* Left */}
          <div>
            <div className="mb-4 inline-flex items-center gap-[7px]">
              <span
                className="h-[5px] w-[5px] rounded-full flex-shrink-0"
                style={{ background: "oklch(49% 0.22 258)" }}
              />
              <span
                className="font-mono text-[11px] font-medium uppercase tracking-[0.06em]"
                style={{ color: "oklch(49% 0.22 258)" }}
              >
                {dictionary.hero.kicker}
              </span>
            </div>

            <h1
              id="hero-heading"
              className="font-display mb-5 text-[clamp(38px,4vw,54px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--ink)]"
            >
              {dictionary.hero.title}
            </h1>

            <p className="mb-8 max-w-[460px] text-base leading-[1.75] text-[var(--ink-2)]">
              {dictionary.hero.description}
            </p>

            <WaitlistForm source="hero" />

            {/* Chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {dictionary.hero.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="flex items-center gap-[7px] rounded-full border border-[var(--border)] bg-[var(--bg-2)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--ink-2)]"
                >
                  <span
                    className="h-[5px] w-[5px] rounded-full flex-shrink-0"
                    style={{ color: "oklch(49% 0.22 258)", background: "oklch(49% 0.22 258)" }}
                  />
                  {bullet}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Briefing mock */}
          <div
            className="w-full rounded-[28px] p-[5px]"
            style={{
              background: "linear-gradient(160deg, #1a2d52 0%, #0e1c3a 100%)",
              boxShadow: "0 32px 80px rgba(10,20,50,0.28), 0 0 0 1px rgba(255,255,255,0.06)"
            }}
          >
            <div
              className="rounded-[23px] border border-white/6 p-5"
              style={{ background: "#0d1830" }}
            >
              {/* Header mockup */}
              <div
                className="mb-4 rounded-[18px] p-4 text-white"
                style={{ background: "linear-gradient(135deg, #1e3a7a 0%, #162d62 100%)" }}
                aria-hidden="true"
              >
                <p className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-white/50">
                  Briefing mockup
                </p>
                <p className="mt-2 font-display text-base font-bold">Demo Event · Client exemple</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/70">
                  <span>14 mai 2026</span>
                  <span>Lieu fictif</span>
                  <span>Équipe démo</span>
                </div>
              </div>

              {/* Module cards */}
              <div className="space-y-2" aria-hidden="true">
                {Object.values(dictionary.sections).map((section) => (
                  <div
                    key={section.title}
                    className="rounded-[12px] px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <p className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-white/40">
                      {section.title}
                    </p>
                    <p className="mt-1 text-[12px] leading-5 text-white/75">{section.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem ── */}
        <section
          aria-labelledby="problem-label"
          className="mb-10 rounded-[20px] px-6 py-5"
          style={{
            background: "var(--amber-bg, oklch(98% 0.04 70))",
            border: "1px solid var(--amber-b, oklch(88% 0.10 68))"
          }}
        >
          <p
            id="problem-label"
            className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] mb-2"
            style={{ color: "oklch(58% 0.16 65)" }}
          >
            {dictionary.problem.label}
          </p>
          <p className="text-[15px] leading-7 text-[var(--ink-2)]">{dictionary.problem.text}</p>
        </section>

        {/* ── Solution / Features ── */}
        <section
          id="solution"
          aria-labelledby="solution-heading"
          className="mb-12 scroll-mt-[72px]"
        >
          <div className="mb-2 inline-flex items-center gap-[7px]">
            <span className="h-[5px] w-[5px] rounded-full flex-shrink-0" style={{ background: "oklch(49% 0.22 258)" }} />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: "oklch(49% 0.22 258)" }}>
              {dictionary.nav.solution}
            </span>
          </div>
          <h2
            id="solution-heading"
            className="font-display mb-8 text-[clamp(26px,2.5vw,36px)] font-bold tracking-[-0.03em] text-[var(--ink)]"
          >
            {dictionary.nav.solution}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dictionary.features.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-2)] px-5 py-5"
                style={{ boxShadow: "0 12px 32px rgba(15,23,42,0.06)" }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{
                    background: "oklch(92% 0.08 258)",
                    color: "oklch(49% 0.22 258)"
                  }}
                >
                  {featureIcons[index]}
                </div>
                <h3 className="font-display text-[14px] font-bold tracking-[-0.01em] text-[var(--ink)]">{feature.title}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-[var(--ink-3)]">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section
          id="how-it-works"
          aria-labelledby="workflow-heading"
          className="mb-12 scroll-mt-[72px]"
        >
          <div className="mb-2 inline-flex items-center gap-[7px]">
            <span className="h-[5px] w-[5px] rounded-full flex-shrink-0" style={{ background: "oklch(49% 0.22 258)" }} />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: "oklch(49% 0.22 258)" }}>
              {dictionary.nav.howItWorks}
            </span>
          </div>
          <h2
            id="workflow-heading"
            className="font-display mb-8 text-[clamp(26px,2.5vw,36px)] font-bold tracking-[-0.03em] text-[var(--ink)]"
          >
            {dictionary.workflow.title}
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {dictionary.workflow.steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-2)] px-5 py-6"
                style={{ boxShadow: "0 12px 32px rgba(15,23,42,0.06)" }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white"
                    style={{ background: "oklch(49% 0.22 258)" }}
                  >
                    {workflowIcons[index] ?? <span className="font-mono text-xs font-bold">{index + 1}</span>}
                  </div>
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--ink-4)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-[15px] font-bold tracking-[-0.01em] text-[var(--ink)]">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[var(--ink-3)]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Waitlist CTA section ── */}
        <section
          id="waitlist"
          className="mb-0 rounded-t-[28px] px-10 py-14 text-white"
          style={{ background: "linear-gradient(135deg, #0e1c3a 0%, #1a2d52 100%)" }}
          aria-labelledby="waitlist-heading"
        >
          <div className="mx-auto max-w-[560px] text-center">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white/50 mb-3">
              {dictionary.hero.kicker}
            </p>
            <h2
              id="waitlist-heading"
              className="font-display mb-4 text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.03em]"
            >
              {dictionary.hero.title}
            </h2>
            <p className="mb-8 text-[15px] leading-[1.7] text-white/70">
              {dictionary.hero.description}
            </p>
            <WaitlistForm source="footer" dark />
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="flex flex-col gap-4 bg-[var(--bg-3)] px-6 py-8 text-[13px] text-[var(--ink-3)] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px]">BriefOPS · {dictionary.footer.marketing}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a className="text-[var(--ink-2)] no-underline transition hover:text-[var(--ink)]" href="/cgu">CGU</a>
            <a className="text-[var(--ink-2)] no-underline transition hover:text-[var(--ink)]" href="/privacy">Confidentialité</a>
            <a className="text-[var(--ink-2)] no-underline transition hover:text-[var(--ink)]" href="/mentions-legales">Mentions légales</a>
            <a className="text-[var(--ink-2)] no-underline transition hover:text-[var(--ink)]" href="/cookies">Cookies</a>
            <a className="text-[var(--ink-2)] no-underline transition hover:text-[var(--ink)]" href={`/${locale}/${dictionary.seoPages.eventBriefingTemplate.slug}`}>
              {dictionary.seoPages.eventBriefingTemplate.navLabel}
            </a>
            <a className="text-[var(--ink-2)] no-underline transition hover:text-[var(--ink)]" href={`/${locale}/${dictionary.seoPages.briefingGenerator.slug}`}>
              {dictionary.seoPages.briefingGenerator.navLabel}
            </a>
            <span className="text-[var(--border-2)]">·</span>
            <span className="font-mono text-[10px] text-[var(--ink-4)]">{dictionary.footer.language}:</span>
            {marketingLocales.map((entry) => (
              <a
                key={entry}
                href={`/${entry}`}
                className={`font-mono text-[10px] font-semibold uppercase no-underline transition ${
                  entry === locale
                    ? "text-[oklch(49%_0.22_258)]"
                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                {entry}
              </a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
