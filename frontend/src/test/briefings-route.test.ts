import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const listBriefings = vi.fn();
const countBriefingsByOrg = vi.fn();
const createBriefing = vi.fn();
const getUserPlan = vi.fn();
const getUserOrgId = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser
}));

vi.mock("@/supabase/queries/briefings", () => ({
  listBriefings,
  countBriefingsByOrg,
  createBriefing
}));

vi.mock("@/supabase/queries/profiles", () => ({
  getUserPlan
}));

vi.mock("@/supabase/queries/modulesRegistry", () => ({
  getUserOrgId
}));

describe("frontend /api/briefings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects briefing creation for another workspace", async () => {
    requireUser.mockResolvedValue({ client: {}, userId: "u1" });
    getUserOrgId.mockResolvedValue("org-1");

    const mod = await import("../../app/api/briefings/route");
    const response = await mod.POST(
      new Request("http://localhost/api/briefings", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          org_id: "22222222-2222-2222-2222-222222222222",
          title: "Test briefing"
        })
      })
    );

    expect(response.status).toBe(403);
    expect(createBriefing).not.toHaveBeenCalled();
  });

  it("creates a briefing for the current workspace", async () => {
    requireUser.mockResolvedValue({ client: {}, userId: "u1" });
    getUserOrgId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
    getUserPlan.mockResolvedValue("free");
    countBriefingsByOrg.mockResolvedValue(0);
    createBriefing.mockResolvedValue({ id: "b1", title: "Test briefing", status: "draft", shared: false });

    const mod = await import("../../app/api/briefings/route");
    const response = await mod.POST(
      new Request("http://localhost/api/briefings", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          org_id: "11111111-1111-1111-1111-111111111111",
          title: "Test briefing"
        })
      })
    );

    expect(response.status).toBe(201);
    expect(createBriefing).toHaveBeenCalled();
  });
});
