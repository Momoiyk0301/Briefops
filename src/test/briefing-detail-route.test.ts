import { beforeEach, describe, expect, it, vi } from "vitest";

const briefingId = "22222222-2222-2222-2222-222222222222";
const workspaceId = "11111111-1111-1111-1111-111111111111";

const requireUser = vi.fn();
const createServiceRoleClient = vi.fn();
const countBriefingsByWorkspace = vi.fn();
const deleteBriefing = vi.fn();
const getBriefingById = vi.fn();
const getUserWorkspaceId = vi.fn();
const updateBriefing = vi.fn();
const workspaceUpdate = vi.fn();
const workspaceUpdateEq = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient
}));

vi.mock("@/supabase/queries/briefings", () => ({
  countBriefingsByWorkspace,
  deleteBriefing,
  getBriefingById,
  updateBriefing
}));

vi.mock("@/supabase/queries/modulesRegistry", () => ({
  getUserWorkspaceId
}));

describe("frontend /api/briefings/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireUser.mockResolvedValue({ client: {}, userId: "user-1" });
    getBriefingById.mockResolvedValue({ id: briefingId, workspace_id: workspaceId, title: "Demo briefing" });
    getUserWorkspaceId.mockResolvedValue(workspaceId);
    deleteBriefing.mockResolvedValue(undefined);
    countBriefingsByWorkspace.mockResolvedValue(2);
    workspaceUpdate.mockReturnValue({ eq: workspaceUpdateEq });
    workspaceUpdateEq.mockResolvedValue({ error: null });
    createServiceRoleClient.mockReturnValue({
      from: () => ({
        update: workspaceUpdate
      })
    });
  });

  it("resyncs the workspace briefing count after deletion", async () => {
    const mod = await import("../../app/api/briefings/[id]/route");
    const response = await mod.DELETE(new Request(`http://localhost/api/briefings/${briefingId}`, { method: "DELETE" }), {
      params: Promise.resolve({ id: briefingId })
    });

    expect(response.status).toBe(200);
    expect(deleteBriefing).toHaveBeenCalledWith({}, briefingId);
    expect(countBriefingsByWorkspace).toHaveBeenCalledWith({}, workspaceId);
    expect(workspaceUpdate).toHaveBeenCalledWith({ briefings_count: 2 });
    expect(workspaceUpdateEq).toHaveBeenCalledWith("id", workspaceId);
  });
});
