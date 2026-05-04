import type { MarketingLocale } from "@/i18n/marketing";
import { getMarketingDictionary, marketingLocales } from "@/i18n/marketing";
import { LocaleHtmlSync } from "@/marketing/LocaleHtmlSync";
import { MarketingNavBar } from "@/marketing/MarketingNavBar";
import { WaitlistForm } from "@/marketing/WaitlistForm";

type LandingPageProps = {
  locale: MarketingLocale;
};

export function LandingPage({ locale }: LandingPageProps) {
  const d = getMarketingDictionary(locale);

  return (
    <div style={{ fontFamily: "var(--ff-body)", background: "var(--bg)", color: "var(--ink)", minHeight: "100vh", overflowX: "hidden" }}>
      <LocaleHtmlSync locale={locale} />

      <MarketingNavBar locale={locale} nav={{ solution: d.nav.solution, howItWorks: d.nav.howItWorks, login: d.nav.login, cta: d.nav.cta }} />

      <main>

        {/* ── HERO ── */}
        <div className="page-wrap">
          <section className="hero">

            {/* Left col */}
            <div>
              <div className="kicker">
                <span className="kicker-dot" />
                {d.hero.kicker}
              </div>

              <h1 className="hero-title">{d.hero.title}</h1>

              <p className="hero-desc">{d.hero.description}</p>

              <WaitlistForm source="hero" />
              <p className="btn-rassurance">{d.hero.bullets[0] ?? "Accès anticipé gratuit · Aucun engagement"}</p>

              <div className="hero-chips">
                {d.hero.bullets.map((bullet, i) => (
                  <div key={i} className="hero-chip">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ width: 14, height: 14, color: "var(--accent)", flexShrink: 0 }}>
                      <rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" />
                      <rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" />
                    </svg>
                    {bullet}
                  </div>
                ))}
              </div>
            </div>

            {/* Right col — Briefing mock */}
            <div className="briefing-mock">
              <div className="briefing-mock-inner">
                <div className="briefing-header">
                  <div className="briefing-header-tag">Briefing opérationnel</div>
                  <div className="briefing-header-title">Festival Printemps · Client XYZ</div>
                  <div className="briefing-header-meta">
                    <span>24 mai 2026</span>
                    <span>Bruxelles Expo</span>
                    <span>Équipe ×12</span>
                  </div>
                  <div className="briefing-status">
                    <span className="briefing-status-dot" />
                    V3 · Publié
                  </div>
                </div>

                <div className="briefing-modules">
                  {Object.entries(d.sections).map(([key, section]) => (
                    <div key={key} className="briefing-module">
                      <div className="briefing-module-tag">
                        {section.title}
                        <span className="briefing-module-dot" />
                      </div>
                      <div className="briefing-module-content">{section.description}</div>
                    </div>
                  ))}
                </div>

                <div className="briefing-segments">
                  <span className="briefing-seg-label">Segments :</span>
                  <span className="briefing-seg active">Terrain</span>
                  <span className="briefing-seg">Catering</span>
                  <span className="briefing-seg">Sécurité</span>
                  <span className="briefing-seg">Direction</span>
                </div>
              </div>
            </div>

          </section>
        </div>

        {/* ── PROBLEM ── */}
        <div className="page-wrap">
          <section className="problem-section">
            <div className="problem-card">
              <div className="problem-label-col">
                <span className="problem-label">{d.problem.label}</span>
                <div className="problem-bar" />
              </div>
              <p className="problem-text">{d.problem.text}</p>
            </div>
          </section>
        </div>

        {/* ── FEATURES ── */}
        <div className="page-wrap">
          <section className="features-section" id="solution">
            <div className="section-header">
              <div className="kicker"><span className="kicker-dot" />{d.nav.solution}</div>
              <h2 className="section-title">{d.features[0]?.title ? d.nav.solution : d.nav.solution}</h2>
              <p className="section-sub">{d.features[0]?.description ?? ""}</p>
            </div>

            <div className="features-grid">
              {d.features.map((feature) => (
                <div key={feature.title} className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ width: 18, height: 18, color: "var(--accent)" }}>
                      <rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="11" y="3" width="6" height="6" rx="1.5" />
                      <rect x="3" y="11" width="6" height="6" rx="1.5" /><rect x="11" y="11" width="6" height="6" rx="1.5" />
                    </svg>
                  </div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-desc">{feature.description}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="how-section" id="how-it-works">
          <div className="page-wrap">
            <div className="section-header">
              <div className="kicker"><span className="kicker-dot" />{d.nav.howItWorks}</div>
              <h2 className="section-title">{d.workflow.title}</h2>
            </div>
            <div className="steps-grid">
              {d.workflow.steps.map((step, index) => (
                <div key={step.title} className="step">
                  <div className="step-num">
                    <span className="step-num-badge">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WAITLIST ── */}
        <section className="waitlist-section" id="waitlist">
          <div className="page-wrap">
            <div className="waitlist-inner">
              <div>
                <span className="waitlist-kicker">{d.hero.kicker}</span>
                <h2 className="waitlist-title">{d.hero.title}</h2>
                <p className="waitlist-desc">{d.hero.description}</p>
              </div>
              <WaitlistForm source="footer" dark />
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="page-wrap">
          <div className="footer-inner">
            <span className="footer-brand">BriefOPS · events-ops.com</span>
            <div className="footer-links">
              <a href={`/${locale}/${d.seoPages.eventBriefingTemplate.slug}`}>{d.seoPages.eventBriefingTemplate.navLabel}</a>
              <a href={`/${locale}/${d.seoPages.briefingGenerator.slug}`}>{d.seoPages.briefingGenerator.navLabel}</a>
              <span style={{ color: "var(--border-2)" }}>·</span>
              <a href="/cgu">CGU</a>
              <a href="/privacy">Confidentialité</a>
              <a href="/mentions-legales">Mentions légales</a>
              <a href="/cookies">Cookies</a>
              <span style={{ color: "var(--border-2)" }}>·</span>
              {marketingLocales.map((entry) => (
                <a key={entry} href={`/${entry}`} style={{ fontFamily: "var(--ff-mono)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: entry === locale ? "var(--accent)" : "var(--ink-3)" }}>
                  {entry}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
