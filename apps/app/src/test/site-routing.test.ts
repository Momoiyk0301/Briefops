import { describe, expect, it } from "vitest";

import { isAppPath, isBypassPath, isLocalizedMarketingPath } from "@/lib/siteRouting";

describe("app route helpers", () => {
  it("recognizes protected app routes", () => {
    expect(isAppPath("/briefings")).toBe(true);
    expect(isAppPath("/briefings/b-1")).toBe(true);
    expect(isAppPath("/settings")).toBe(true);
    expect(isAppPath("/fr")).toBe(false);
  });

  it("recognizes localized marketing routes", () => {
    expect(isLocalizedMarketingPath("/fr")).toBe(true);
    expect(isLocalizedMarketingPath("/nl/event-briefing-template")).toBe(true);
    expect(isLocalizedMarketingPath("/login")).toBe(false);
  });

  it("bypasses API and static paths", () => {
    expect(isBypassPath("/api/status")).toBe(true);
    expect(isBypassPath("/_next/static/app.js")).toBe(true);
    expect(isBypassPath("/briefings")).toBe(false);
  });
});
