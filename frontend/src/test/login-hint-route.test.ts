import { beforeEach, describe, expect, it, vi } from "vitest";

const listUsers = vi.fn();

vi.mock("@/supabase/server", () => ({
  createServiceRoleClient: () => ({
    auth: {
      admin: {
        listUsers
      }
    }
  })
}));

vi.mock("@/server/rateLimit", () => ({
  enforceRateLimit: vi.fn(() => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000 })),
  resolveRateLimitKey: vi.fn(() => "login-hint:test")
}));

describe("/api/auth/login-hint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existence and confirmation state for a known user", async () => {
    listUsers.mockResolvedValueOnce({
      data: {
        users: [{ email: "ops@briefops.app", email_confirmed_at: "2026-04-07T00:00:00.000Z" }],
        nextPage: null
      },
      error: null
    });

    const mod = await import("../../app/api/auth/login-hint/route");
    const response = await mod.POST(
      new Request("http://localhost/api/auth/login-hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "ops@briefops.app" })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ exists: true, email_confirmed: true });
  });
});
