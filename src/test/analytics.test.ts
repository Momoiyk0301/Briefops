import { afterEach, describe, expect, it } from "vitest";

import { checkAnalyticsEnabled } from "@/lib/analytics";

describe("checkAnalyticsEnabled", () => {
  afterEach(() => {
    document.cookie = "ignore_analytics=; path=/; max-age=0";
  });

  it("keeps analytics enabled by default", () => {
    expect(checkAnalyticsEnabled()).toBe(true);
  });

  it("disables analytics when the founder cookie is present", () => {
    document.cookie = "ignore_analytics=true; path=/";

    expect(checkAnalyticsEnabled()).toBe(false);
  });
});
