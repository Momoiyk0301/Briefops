import { describe, expect, it } from "vitest";

import { detectMarketingLocale, getMarketingDictionary } from "@/i18n/marketing";

describe("marketing i18n", () => {
  it("falls back to french when no header is provided", () => {
    expect(detectMarketingLocale(undefined)).toBe("fr");
  });

  it("detects dutch from the accept-language header", () => {
    expect(detectMarketingLocale("nl-BE,nl;q=0.9,fr;q=0.6")).toBe("nl");
  });

  it("returns the proper dictionary copy for each locale", () => {
    expect(getMarketingDictionary("fr").hero.primaryCta).toBe("Essai gratuit");
    expect(getMarketingDictionary("nl").footer.app).toBe("Applicatie");
    expect(getMarketingDictionary("en").seoPages.briefingGenerator.meta.title).toMatch(/Briefing generator/i);
  });
});
