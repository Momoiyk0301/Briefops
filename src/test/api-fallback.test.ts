import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getBriefingsWithFallback, getMe } from "@/lib/api";

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn()
}));

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

  it("keeps degraded me fallback for server outages", async () => {
    mockGetSession.mockResolvedValue({ access_token: "token", user: { id: "u1", email: "ops@test.com" } });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "boom", request_id: "req-1" }), {
        status: 500,
        headers: { "content-type": "application/json" }
      })
    );

    const result = await getMe();

    expect(result.degraded).toBe(true);
    expect(result.user?.id).toBe("u1");
  });

  it("does not mask unauthorized me responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized", request_id: "req-2" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );

    await expect(getMe()).rejects.toMatchObject({ status: 401 });
  });
});
