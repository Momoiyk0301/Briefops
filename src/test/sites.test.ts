import { afterEach, describe, expect, it, vi } from "vitest";

describe("site urls", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("keeps localhost defaults outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("MARKETING_SITE_URL", "");

    const { getAppUrl, getMarketingSiteUrl } = await import("@/lib/sites");

    expect(getAppUrl()).toBe("http://localhost:3000");
    expect(getMarketingSiteUrl()).toBe("http://localhost:3000");
  });

  it("falls back to production hosts when env vars are missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("MARKETING_SITE_URL", "");

    const { getAppUrl, getMarketingSiteUrl, buildAppUrl } = await import("@/lib/sites");

    expect(getAppUrl()).toBe("https://briefing.events-ops.be");
    expect(getMarketingSiteUrl()).toBe("https://events-ops.be");
    expect(buildAppUrl("/login?mode=register")).toBe("https://briefing.events-ops.be/login?mode=register");
  });
});
