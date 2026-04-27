import { FileText, Layers, Smartphone, Users } from "lucide-react";

import type { MarketingLocale } from "@/i18n/marketing";
import { getMarketingDictionary, marketingLocales } from "@/i18n/marketing";
import { buildAppUrl } from "@/lib/sites";
import { LocaleHtmlSync } from "@/marketing/LocaleHtmlSync";
import { MarketingNavBar } from "@/marketing/MarketingNavBar";

type LandingPageProps = {
  locale: MarketingLocale;
};

const featureIcons = [
  <FileText key="file" size={22} />,
  <Layers key="layers" size={22} />,
  <Users key="users" size={22} />,
  <Smartphone key="phone" size={22} />,
];

const featureColors = [
  "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300",
  "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300",
  "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300",
];

export function LandingPage({ locale }: LandingPageProps) {
  const dictionary = getMarketingDictionary(locale);
  const loginUrl = buildAppUrl("/login");
  const registerUrl = buildAppUrl("/login?mode=register");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#eef4ff_48%,#fff7ef_100%)] text-[#10203a]">
      <LocaleHtmlSync locale={locale} />

      <MarketingNavBar
        locale={locale}
        loginUrl={loginUrl}
        registerUrl={registerUrl}
        nav={{
          solution: dictionary.nav.solution,
          howItWorks: dictionary.nav.howItWorks,
          login: dictionary.nav.login,
          cta: dictionary.nav.cta
        }}
      />

      <main className="mx-auto max-w-[1440px] px-4 pb-12 pt-[72px] sm:px-6 lg:px-10 xl:px-12">

        {/* ── Hero ── */}
        <section
          aria-labelledby="hero-heading"
          className="grid gap-10 py-12 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-center xl:py-16"
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5870a8]">
                {dictionary.hero.kicker}
              </p>
              <h1
                id="hero-heading"
                className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.25rem]"
              >
                {dictionary.hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[#51627f] sm:text-lg">
                {dictionary.hero.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={registerUrl}
                className="rounded-full bg-[#10203a] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(16,32,58,0.18)] transition hover:bg-[#0d1a30]"
              >
                {dictionary.hero.primaryCta}
              </a>
              <a
                href={loginUrl}
                className="rounded-full border border-[#d4deef] bg-white px-6 py-3 text-sm font-medium text-[#29436c] transition hover:border-[#b7c9e7]"
              >
                {dictionary.hero.secondaryCta}
              </a>
            </div>

            <ul className="grid gap-3 sm:grid-cols-3" role="list">
              {dictionary.hero.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-[20px] border border-white/80 bg-white/85 px-4 py-3 text-sm font-medium text-[#21334f] shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Mock briefing preview */}
          <div className="w-full min-w-0 rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,#163a78_0%,#275ab5_45%,#5fb7ff_100%)] p-4 text-white shadow-[0_40px_120px_rgba(34,76,167,0.28)] sm:p-5">
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5">
              <div className="rounded-[24px] bg-white/95 p-4 text-[#10203a] sm:p-5">
                <div className="rounded-[20px] bg-[linear-gradient(135deg,#66748f_0%,#44536f_100%)] px-5 py-5 text-white" aria-hidden="true">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Briefing</p>
                  <p className="mt-3 text-xl font-semibold">Municipalia · Ethias</p>
                  <p className="mt-2 text-sm text-white/80">12 avril 2026 · Marche-en-Famenne</p>
                  <p className="mt-1 text-sm text-white/80">Contact · Pascale 0486 44 47 03</p>
                </div>

                <div className="mt-4 space-y-3" aria-hidden="true">
                  {Object.values(dictionary.sections).map((section) => (
                    <div
                      key={section.title}
                      className="rounded-[16px] border border-[#d6def1] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607293]">{section.title}</p>
                      <p className="mt-1.5 text-sm leading-5 text-[#4f5f7b]">{section.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Problem ── */}
        <section
          aria-labelledby="problem-label"
          className="mb-10 rounded-[28px] border border-[#fde8c8]/80 bg-[#fffaf4]/90 px-6 py-6 shadow-[0_12px_40px_rgba(180,100,20,0.06)]"
        >
          <p id="problem-label" className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c07a30]">
            {dictionary.problem.label}
          </p>
          <p className="mt-2 text-base leading-7 text-[#7a4a1a]">{dictionary.problem.text}</p>
        </section>

        {/* ── Solution / Features ── */}
        <section
          id="solution"
          aria-labelledby="solution-heading"
          className="mb-10 scroll-mt-20"
        >
          <h2
            id="solution-heading"
            className="mb-6 text-2xl font-semibold text-[#10203a] sm:text-3xl"
          >
            {dictionary.nav.solution}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dictionary.features.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-[28px] border border-white/80 bg-white/85 px-5 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[14px] ${featureColors[index]}`}>
                  {featureIcons[index]}
                </div>
                <h3 className="text-base font-semibold text-[#10203a]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#55657f]">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section
          id="how-it-works"
          aria-labelledby="workflow-heading"
          className="mb-10 scroll-mt-20"
        >
          <h2
            id="workflow-heading"
            className="mb-6 text-2xl font-semibold text-[#10203a] sm:text-3xl"
          >
            {dictionary.workflow.title}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {dictionary.workflow.steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-[28px] border border-white/80 bg-white/85 px-5 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6980ac]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-[#10203a]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#55657f]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="flex flex-col gap-4 border-t border-[#dde5f0]/60 py-6 text-sm text-[#5b6b86] sm:flex-row sm:items-center sm:justify-between">
          <p>BriefOPS · {dictionary.footer.marketing}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a className="font-medium text-[#23457a] transition hover:text-[#10203a]" href={loginUrl}>
              {dictionary.footer.app}
            </a>
            <a className="font-medium text-[#23457a] transition hover:text-[#10203a]" href={`/${locale}/${dictionary.seoPages.eventBriefingTemplate.slug}`}>
              {dictionary.seoPages.eventBriefingTemplate.navLabel}
            </a>
            <a className="font-medium text-[#23457a] transition hover:text-[#10203a]" href={`/${locale}/${dictionary.seoPages.briefingGenerator.slug}`}>
              {dictionary.seoPages.briefingGenerator.navLabel}
            </a>
            <span className="text-[#cbd5e1]">·</span>
            <span className="text-xs text-[#8a97b0]">{dictionary.footer.language}:</span>
            {marketingLocales.map((entry) => (
              <a
                key={entry}
                href={`/${entry}`}
                className={`text-xs font-semibold uppercase transition ${
                  entry === locale ? "text-[#1d4ed8]" : "text-[#6a7b9b] hover:text-[#10203a]"
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
