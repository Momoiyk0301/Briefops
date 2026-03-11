import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const listBriefings = vi.fn();
const createBriefing = vi.fn();
const countBriefingsByOrg = vi.fn();
const getUserPlan = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser
}));

vi.mock("@/supabase/queries/briefings", () => ({
  listBriefings,
  createBriefing,
  countBriefingsByOrg
}));

vi.mock("@/supabase/queries/profiles", () => ({
  getUserPlan
}));

describe("/api/briefings route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when auth is missing", async () => {
    requireUser.mockRejectedValueOnce(new Error("Unauthorized"));
    const mod = await import("../app/api/briefings/route");

    const response = await mod.GET(new Request("http://localhost/api/briefings"));
    expect(response.status).toBe(401);
  });

  it("creates briefing when payload is valid", async () => {
    requireUser.mockResolvedValueOnce({ client: {}, userId: "user-1" });
    getUserPlan.mockResolvedValueOnce("free");
    countBriefingsByOrg.mockResolvedValueOnce(0);
    createBriefing.mockResolvedValueOnce({ id: "b1" });

    const mod = await import("../app/api/briefings/route");
    const response = await mod.POST(
      new Request("http://localhost/api/briefings", {
        method: "POST",
        body: JSON.stringify({ workspace_id: "11111111-1111-1111-1111-111111111111", title: "test" }),
        headers: { "content-type": "application/json", authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(201);
    expect(createBriefing).toHaveBeenCalled();
  });

  it("returns 402 when free plan limit is reached", async () => {
    requireUser.mockResolvedValueOnce({ client: {}, userId: "user-1" });
    getUserPlan.mockResolvedValueOnce("free");
    countBriefingsByOrg.mockResolvedValueOnce(1);

    const mod = await import("../app/api/briefings/route");
    const response = await mod.POST(
      new Request("http://localhost/api/briefings", {
        method: "POST",
        body: JSON.stringify({ workspace_id: "11111111-1111-1111-1111-111111111111", title: "test" }),
        headers: { "content-type": "application/json", authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(402);
    expect(createBriefing).not.toHaveBeenCalled();
  });

  it("lists briefings", async () => {
    requireUser.mockResolvedValueOnce({ client: {}, userId: "user-1" });
    listBriefings.mockResolvedValueOnce([{ id: "b1" }]);
    const mod = await import("../app/api/briefings/route");

    const response = await mod.GET(new Request("http://localhost/api/briefings", { headers: { authorization: "Bearer token" } }));
    expect(response.status).toBe(200);
  });
});
