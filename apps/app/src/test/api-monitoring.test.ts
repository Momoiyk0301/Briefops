import { beforeEach, describe, expect, it, vi } from "vitest";

const sentryScope = {
  setTag: vi.fn(),
  setContext: vi.fn()
};

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  withScope: vi.fn((callback: (scope: typeof sentryScope) => void) => callback(sentryScope))
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ access_token: "token" })
}));

vi.mock("@sentry/nextjs", () => sentryMocks);

describe("api monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures fetch failures before surfacing them to the UI", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down")) as typeof fetch;
    const { getBriefing } = await import("@/lib/api");

    await expect(getBriefing("briefing-1")).rejects.toMatchObject({ status: 0 });
    expect(sentryMocks.withScope).toHaveBeenCalled();
    expect(sentryMocks.captureException).toHaveBeenCalled();
  });
});
