import { describe, expect, it } from "vitest";

import { resolveLandingRouting } from "@/lib/siteRouting";

describe("resolveLandingRouting", () => {
  it("keeps the marketing root on the landing page", () => {
    expect(
      resolveLandingRouting({
        pathname: "/",
        acceptLanguage: "nl-BE,nl;q=0.9,fr;q=0.7"
      })
    ).toEqual({ action: "next" });
  });

  it("redirects app routes to the app url", () => {
    expect(
      resolveLandingRouting({
        pathname: "/login",
        search: "?mode=register"
      })
    ).toEqual({
      action: "redirect",
      destination: "http://localhost:3000/login?mode=register",
      reason: "landing-to-app"
    });
  });

  it("keeps localized landing paths", () => {
    expect(resolveLandingRouting({ pathname: "/fr" })).toEqual({ action: "next" });
    expect(resolveLandingRouting({ pathname: "/en/event-briefing-template" })).toEqual({ action: "next" });
  });

  it("normalizes unknown landing paths to the preferred locale", () => {
    expect(
      resolveLandingRouting({
        pathname: "/unknown",
        acceptLanguage: "fr-BE,fr;q=0.9"
      })
    ).toEqual({
      action: "redirect",
      destination: "/fr",
      reason: "landing-normalize-locale",
      locale: "fr"
    });
  });

  it("uses english by default for unsupported browser languages", () => {
    expect(
      resolveLandingRouting({
        pathname: "/unknown",
        acceptLanguage: "de-DE,de;q=0.9"
      })
    ).toEqual({
      action: "redirect",
      destination: "/en",
      reason: "landing-normalize-locale",
      locale: "en"
    });
  });
});
