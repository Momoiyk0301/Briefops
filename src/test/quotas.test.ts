import { describe, expect, it } from "vitest";

import { LIMITS, checkQuota, getPlanLimits, getRemainingQuota, normalizePlan, resetPdfQuotaIfNeeded } from "@/lib/quotas";

describe("quotas", () => {
  it("normalizes plans and keeps guest/funder aligned with pro limits", () => {
    expect(normalizePlan("guest")).toBe("guest");
    expect(normalizePlan("funder")).toBe("funder");
    expect(getPlanLimits("guest")).toEqual(LIMITS.guest);
    expect(getPlanLimits("funder")).toEqual(LIMITS.funder);
    expect(getPlanLimits("pro").storage).toBe(getPlanLimits("guest").storage);
    expect(getPlanLimits("pro").storage).toBe(getPlanLimits("funder").storage);
  });

  it("treats enterprise as unlimited", () => {
    const result = checkQuota(
      {
        plan: "enterprise",
        briefings_count: 99_999,
        storage_used_bytes: 99_999_999,
        pdf_exports_month: 99_999,
        pdf_exports_reset_at: new Date().toISOString()
      },
      "export_pdf"
    );

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });

  it("enforces starter briefing and pdf limits", () => {
    expect(
      checkQuota(
        {
          plan: "starter",
          briefings_count: 5,
          storage_used_bytes: 0,
          pdf_exports_month: 0,
          pdf_exports_reset_at: new Date().toISOString()
        },
        "create_briefing"
      ).allowed
    ).toBe(false);

    expect(
      checkQuota(
        {
          plan: "starter",
          briefings_count: 0,
          storage_used_bytes: 0,
          pdf_exports_month: 10,
          pdf_exports_reset_at: new Date().toISOString()
        },
        "export_pdf"
      ).allowed
    ).toBe(false);
  });

  it("resets monthly pdf usage when reset date is passed", () => {
    const reset = resetPdfQuotaIfNeeded({
      plan: "starter",
      pdf_exports_month: 7,
      pdf_exports_reset_at: "2020-01-01T00:00:00.000Z"
    });

    expect(reset.pdf_exports_month).toBe(0);
    expect(new Date(reset.pdf_exports_reset_at).getTime()).toBeGreaterThan(Date.now() - 86_400_000);
  });

  it("returns remaining quota snapshot", () => {
    const remaining = getRemainingQuota({
      plan: "starter",
      briefings_count: 2,
      storage_used_bytes: 5 * 1024 * 1024,
      pdf_exports_month: 3,
      pdf_exports_reset_at: new Date().toISOString()
    });

    expect(remaining.briefings).toBe(3);
    expect(remaining.pdf_month).toBe(7);
    expect(remaining.storage).toBe(15 * 1024 * 1024);
    expect(remaining.watermark).toBe(true);
  });
});
