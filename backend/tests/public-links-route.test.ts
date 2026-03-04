import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const createPublicLink = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser
}));

vi.mock("@/supabase/queries/publicLinks", () => ({
  createPublicLink
}));

vi.mock("@/env", () => ({
  env: { APP_URL: "http://localhost:3000" }
}));

describe("/api/public-links", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a share link when briefing belongs to user", async () => {
    const maybeSingle = vi.fn().mockResolvedValueOnce({
      data: { id: "b1", created_by: "user-1" },
      error: null
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    requireUser.mockResolvedValueOnce({ client: { from }, userId: "user-1" });
    createPublicLink.mockResolvedValueOnce({ token: "11111111-1111-1111-1111-111111111111" });

    const mod = await import("../app/api/public-links/route");
    const response = await mod.POST(
      new Request("http://localhost/api/public-links", {
        method: "POST",
        body: JSON.stringify({ briefingId: "11111111-1111-1111-1111-111111111111" }),
        headers: { "content-type": "application/json", authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.shareUrl).toContain("/share/");
  });
});
