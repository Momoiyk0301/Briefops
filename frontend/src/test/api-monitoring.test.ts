import { beforeEach, describe, expect, it, vi } from "vitest";

const monitoringMocks = vi.hoisted(() => ({ captureClientError: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ access_token: "token" })
}));

vi.mock("@/lib/monitoring", () => monitoringMocks);

describe("api monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures fetch failures before surfacing them to the UI", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as typeof fetch;
    const { getBriefing } = await import("@/lib/api");

    await expect(getBriefing("briefing-1")).rejects.toMatchObject({ status: 0 });
    expect(monitoringMocks.captureClientError).toHaveBeenCalled();
  });
});
