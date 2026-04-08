import { describe, expect, it } from "vitest";

import { resolveSiteRouting } from "@/lib/siteRouting";

describe("resolveSiteRouting", () => {
  it("redirects the marketing root to the preferred localized landing", () => {
    expect(
      resolveSiteRouting({
        host: "events-ops.be",
        pathname: "/",
        acceptLanguage: "nl-BE,nl;q=0.9,fr;q=0.7"
      })
    ).toEqual({
      action: "redirect",
      destination: "http://localhost:3000/nl",
      reason: "marketing-root-locale",
      locale: "nl"
    });
  });

  it("redirects app routes from the marketing host to the app url", () => {
    expect(
      resolveSiteRouting({
        host: "events-ops.be",
        pathname: "/login",
        search: "?mode=register"
      })
    ).toEqual({
      action: "redirect",
      destination: "http://localhost:3000/login?mode=register",
      reason: "marketing-to-app"
    });
  });

  it("keeps localized landing paths on the marketing host", () => {
    expect(
      resolveSiteRouting({
        host: "events-ops.be",
        pathname: "/fr"
      })
    ).toEqual({ action: "next" });
  });

  it("redirects localized landing paths away from the app host", () => {
    expect(
      resolveSiteRouting({
        host: "briefing.events-ops.be",
        pathname: "/nl"
      })
    ).toEqual({
      action: "redirect",
      destination: "http://localhost:3000/nl",
      reason: "app-to-marketing"
    });
  });

  it("redirects localhost root to the localized landing while leaving app routes untouched", () => {
    expect(
      resolveSiteRouting({
        host: "localhost:3000",
        pathname: "/",
        acceptLanguage: "fr-BE,fr;q=0.9"
      })
    ).toEqual({
      action: "redirect",
      destination: "/fr",
      reason: "local-root-locale",
      locale: "fr"
    });

    expect(
      resolveSiteRouting({
        host: "localhost:3000",
        pathname: "/briefings"
      })
    ).toEqual({ action: "next" });
  });
});

