import type { MarketingLocale } from "@/i18n/marketing";
import { getMarketingDictionary, marketingLocales } from "@/i18n/marketing";
import { buildAppUrl } from "@/lib/sites";
import { LocaleHtmlSync } from "@/marketing/LocaleHtmlSync";

type LandingPageProps = {
  locale: MarketingLocale;
};

export function LandingPage({ locale }: LandingPageProps) {
  const dictionary = getMarketingDictionary(locale);
  const alternateLocale = locale === "fr" ? "nl" : "fr";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f7fbff_0%,#eef4ff_48%,#fff7ef_100%)] text-[#10203a]">
      <LocaleHtmlSync locale={locale} />

      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-10 xl:px-12">
        <header className="flex flex-col gap-4 rounded-[30px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2b65ff_0%,#55b4ff_100%)] text-lg font-semibold text-white shadow-[0_16px_32px_rgba(43,101,255,0.24)]">
              B
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6a7b9b]">BriefOPS</p>
              <p className="text-sm text-[#53627e]">{dictionary.nav.product}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            <a
              className="rounded-full border border-[#d6def1] px-4 py-2 text-sm font-medium text-[#28436b] transition hover:border-[#b9c8e4] hover:bg-white"
              href={buildAppUrl("/login")}
            >
              {dictionary.nav.login}
            </a>
            <a
              className="rounded-full bg-[#2b65ff] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(43,101,255,0.25)] transition hover:bg-[#2357de]"
              href={buildAppUrl("/login?mode=register")}
            >
              {dictionary.nav.cta}
            </a>
            <div className="flex items-center gap-2 rounded-full border border-[#d6def1] bg-white px-3 py-2 text-sm text-[#53627e]">
              <span className="font-medium">{dictionary.footer.language}</span>
              {marketingLocales.map((entry) => (
                <a
                  key={entry}
                  href={`/${entry}`}
                  className={`rounded-full px-2 py-1 font-semibold uppercase ${
                    entry === locale ? "bg-[#e9f0ff] text-[#1d4ed8]" : "text-[#6a7b9b]"
                  }`}
                >
                  {entry}
                </a>
              ))}
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-8 lg:gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:items-center xl:py-10">
          <div className="space-y-7">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5870a8]">{dictionary.hero.kicker}</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {dictionary.hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[#51627f] sm:text-lg">
                {dictionary.hero.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                className="rounded-full bg-[#10203a] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(16,32,58,0.18)] transition hover:bg-[#0d1a30]"
                href={buildAppUrl("/login?mode=register")}
              >
                {dictionary.hero.primaryCta}
              </a>
              <a
                className="rounded-full border border-[#d4deef] bg-white px-5 py-3 text-sm font-medium text-[#29436c] transition hover:border-[#b7c9e7]"
                href={buildAppUrl("/login")}
              >
                {dictionary.hero.secondaryCta}
              </a>
            </div>

            <ul className="grid gap-3 md:grid-cols-3">
              {dictionary.hero.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="rounded-[24px] border border-white/80 bg-white/85 px-4 py-4 text-sm font-medium text-[#21334f] shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full min-w-0 rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,#163a78_0%,#275ab5_45%,#5fb7ff_100%)] p-4 text-white shadow-[0_40px_120px_rgba(34,76,167,0.28)] sm:p-5">
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5">
              <div className="rounded-[24px] bg-white/95 p-4 text-[#10203a] sm:p-5">
                <div className="rounded-[20px] bg-[linear-gradient(135deg,#66748f_0%,#44536f_100%)] px-5 py-5 text-white">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">Briefing</p>
                  <h2 className="mt-3 text-2xl font-semibold">Municipalia - Ethias</h2>
                  <p className="mt-3 text-sm text-white/82">12 avril 2026 · Rue des Deux Provinces 1, 6900 Marche-en-Famenne</p>
                  <p className="mt-1 text-sm text-white/82">Contact · Pascale 0486444703</p>
                </div>

                <div className="mt-4 space-y-3">
                  {Object.values(dictionary.sections).map((section) => (
                    <article key={section.title} className="rounded-[20px] border border-[#d6def1] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#607293]">{section.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#4f5f7b]">{section.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-3">
          {dictionary.workflow.steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[28px] border border-white/80 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6980ac]">
                {dictionary.workflow.title} · {index + 1}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[#10203a]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#55657f]">{step.description}</p>
            </article>
          ))}
        </section>

        <footer className="flex flex-col gap-3 border-t border-white/70 py-5 text-sm text-[#5b6b86] md:flex-row md:items-center md:justify-between">
          <p>BriefOPS · {dictionary.footer.marketing}</p>
          <div className="flex flex-wrap gap-4">
            <a className="font-medium text-[#23457a]" href={buildAppUrl("/login")}>
              {dictionary.footer.app}
            </a>
            <a className="font-medium text-[#23457a]" href={`/${alternateLocale}`}>
              {alternateLocale.toUpperCase()}
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
