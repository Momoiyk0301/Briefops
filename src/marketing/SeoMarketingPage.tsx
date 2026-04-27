import { ArrowRight, CheckCircle2, FileText, Layers, Link as LinkIcon } from "lucide-react";

import type { MarketingLocale } from "@/i18n/marketing";
import { getMarketingDictionary, marketingLocales } from "@/i18n/marketing";
import { buildAppUrl } from "@/lib/sites";
import { LocaleHtmlSync } from "@/marketing/LocaleHtmlSync";
import { MarketingNavBar } from "@/marketing/MarketingNavBar";

type SeoPageKey = "eventBriefingTemplate" | "briefingGenerator";

type Props = {
  locale: MarketingLocale;
  pageKey: SeoPageKey;
};

function getCrossLink(pageKey: SeoPageKey) {
  return pageKey === "eventBriefingTemplate" ? "briefingGenerator" : "eventBriefingTemplate";
}

export function SeoMarketingPage({ locale, pageKey }: Props) {
  const dictionary = getMarketingDictionary(locale);
  const page = dictionary.seoPages[pageKey];
  const crossPage = dictionary.seoPages[getCrossLink(pageKey)];
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

      <main className="mx-auto max-w-[1200px] px-4 pb-12 pt-[96px] sm:px-6 lg:px-10">
        <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5870a8]">{page.hero.kicker}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {page.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#51627f] sm:text-lg">{page.hero.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={registerUrl}
                className="inline-flex items-center gap-2 rounded-full bg-[#10203a] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(16,32,58,0.18)] transition hover:bg-[#0d1a30]"
              >
                {page.hero.primaryCta}
                <ArrowRight size={16} />
              </a>
              <a
                href={`/${locale}/${crossPage.slug}`}
                className="rounded-full border border-[#d4deef] bg-white px-6 py-3 text-sm font-medium text-[#29436c] transition hover:border-[#b7c9e7]"
              >
                {page.hero.secondaryCta}
              </a>
            </div>
          </div>

          <aside className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
            <div className="rounded-[22px] bg-[#10203a] p-5 text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/14">
                <FileText size={22} />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/62">BriefOPS</p>
              <h2 className="mt-2 text-2xl font-semibold">{page.navLabel}</h2>
            </div>
            <div className="mt-4 space-y-3">
              {page.checklist.map((item) => (
                <div key={item} className="flex gap-3 rounded-[18px] border border-[#dde5f2] bg-[#f8fbff] p-3 text-sm text-[#43536f]">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={17} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-4 py-6 md:grid-cols-3">
          {page.sections.map((section, index) => {
            const Icon = index === 0 ? Layers : index === 1 ? FileText : LinkIcon;
            return (
              <article key={section.title} className="rounded-[26px] border border-white/80 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600">
                  <Icon size={21} />
                </div>
                <h2 className="text-lg font-semibold text-[#10203a]">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#55657f]">{section.description}</p>
              </article>
            );
          })}
        </section>

        <section className="my-8 rounded-[28px] border border-[#dce6f4] bg-white/86 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold">{page.checklistTitle}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.checklist.map((item) => (
              <p key={item} className="rounded-[18px] bg-[#f3f7ff] px-4 py-3 text-sm font-medium text-[#354761]">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] bg-[#10203a] px-6 py-8 text-white shadow-[0_26px_80px_rgba(16,32,58,0.22)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{page.finalCta.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/74">{page.finalCta.description}</p>
            </div>
            <a
              href={registerUrl}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#10203a] transition hover:bg-[#edf4ff]"
            >
              {page.finalCta.button}
              <ArrowRight size={16} />
            </a>
          </div>
        </section>

        <footer className="mt-10 flex flex-col gap-4 border-t border-[#dde5f0]/60 py-6 text-sm text-[#5b6b86] sm:flex-row sm:items-center sm:justify-between">
          <p>BriefOPS · {dictionary.footer.marketing}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a className="font-medium text-[#23457a] transition hover:text-[#10203a]" href={`/${locale}`}>
              {dictionary.nav.product}
            </a>
            <span className="text-[#cbd5e1]">·</span>
            {marketingLocales.map((entry) => (
              <a
                key={entry}
                href={`/${entry}/${page.slug}`}
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
