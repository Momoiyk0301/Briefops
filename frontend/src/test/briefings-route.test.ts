import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const workspaceUpdateEq = vi.fn();
const createServiceRoleClient = vi.fn(() => ({
  from: () => ({
    update: () => ({
      eq: workspaceUpdateEq
    })
  })
}));
const listBriefings = vi.fn();
const countBriefingsByWorkspace = vi.fn();
const createBriefing = vi.fn();
const getUserPlan = vi.fn();
const getUserWorkspaceId = vi.fn();
const getWorkspaceById = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient
}));

vi.mock("@/supabase/queries/briefings", () => ({
  listBriefings,
  countBriefingsByWorkspace,
  createBriefing
}));

vi.mock("@/supabase/queries/profiles", () => ({
  getUserPlan
}));

vi.mock("@/supabase/queries/modulesRegistry", () => ({
  getUserWorkspaceId
}));

vi.mock("@/supabase/queries/workspaces", () => ({
  getWorkspaceById
}));

describe("frontend /api/briefings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    workspaceUpdateEq.mockResolvedValue({ error: null });
    getWorkspaceById.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Ops",
      briefings_count: 0,
      storage_used_bytes: 0,
      pdf_exports_month: 0,
      pdf_exports_reset_at: new Date().toISOString()
    });
  });

  it("rejects briefing creation for another workspace", async () => {
    requireUser.mockResolvedValue({
      client: {},
      userId: "u1"
    });
    getUserWorkspaceId.mockResolvedValue("org-1");

    const mod = await import("../../app/api/briefings/route");
    const response = await mod.POST(
      new Request("http://localhost/api/briefings", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          workspace_id: "22222222-2222-2222-2222-222222222222",
          title: "Test briefing"
        })
      })
    );

    expect(response.status).toBe(403);
    expect(createBriefing).not.toHaveBeenCalled();
  });

  it("creates a briefing for the current workspace", async () => {
    requireUser.mockResolvedValue({
      client: {},
      userId: "u1"
    });
    getUserWorkspaceId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
    getUserPlan.mockResolvedValue("free");
    countBriefingsByWorkspace.mockResolvedValue(0);
    createBriefing.mockResolvedValue({ id: "b1", title: "Test briefing", status: "draft", shared: false });

    const mod = await import("../../app/api/briefings/route");
    const response = await mod.POST(
      new Request("http://localhost/api/briefings", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          workspace_id: "11111111-1111-1111-1111-111111111111",
          title: "Test briefing"
        })
      })
    );

    expect(response.status).toBe(201);
    expect(createBriefing).toHaveBeenCalled();
  });

  it("blocks starter briefing creation when quota is exceeded", async () => {
    requireUser.mockResolvedValue({ client: {}, userId: "u1" });
    getUserWorkspaceId.mockResolvedValue("11111111-1111-1111-1111-111111111111");
    getUserPlan.mockResolvedValue("starter");
    getWorkspaceById.mockResolvedValue({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Ops",
      briefings_count: 5,
      storage_used_bytes: 0,
      pdf_exports_month: 0,
      pdf_exports_reset_at: new Date().toISOString()
    });

    const mod = await import("../../app/api/briefings/route");
    const response = await mod.POST(
      new Request("http://localhost/api/briefings", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          workspace_id: "11111111-1111-1111-1111-111111111111",
          title: "Blocked briefing"
        })
      })
    );

    expect(response.status).toBe(402);
    expect(createBriefing).not.toHaveBeenCalled();
  });
});
