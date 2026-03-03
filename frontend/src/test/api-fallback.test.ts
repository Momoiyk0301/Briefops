import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getBriefingsWithFallback } from "@/lib/api";

const mockGetSession = vi.fn();

vi.mock("@/lib/auth", () => ({
  getSession: mockGetSession
}));

describe("api fallback", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ access_token: "token" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns demo data when briefings endpoint fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("{}", { status: 500 }));

    const result = await getBriefingsWithFallback();

    expect(result.demo).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });
});
