import { afterEach, describe, expect, it } from "vitest";

import { checkAnalyticsEnabled } from "@/lib/analytics";

describe("checkAnalyticsEnabled", () => {
  const originalReferrer = document.referrer;

  function setReferrer(value: string) {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value
    });
  }

  afterEach(() => {
    document.cookie = "ignore_analytics=; path=/; max-age=0";
    setReferrer(originalReferrer);
  });

  it("keeps analytics enabled by default", () => {
    expect(checkAnalyticsEnabled()).toBe(true);
  });

  it("disables analytics when the founder cookie is present", () => {
    document.cookie = "ignore_analytics=true; path=/";

    expect(checkAnalyticsEnabled()).toBe(false);
  });

  it("disables analytics when referrer is a vercel domain", () => {
    setReferrer("https://briefops-preview.vercel.app/");

    expect(checkAnalyticsEnabled()).toBe(false);
  });
});
