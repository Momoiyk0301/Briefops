import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getBriefingById = vi.fn();
const getUserWorkspaceId = vi.fn();
const getNextBriefingExportVersion = vi.fn();
const createBriefingExport = vi.fn();
const getBriefingExportById = vi.fn();
const updateBriefingExport = vi.fn();
const listModules = vi.fn();
const getUserPlan = vi.fn();
const consumePdfExport = vi.fn();
const getCurrentMonthUsage = vi.fn();
const renderBriefingPdf = vi.fn();
const upload = vi.fn();
const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient: () => ({
    from: () => ({
      update
    }),
    storage: {
      from: () => ({ upload })
    }
  })
}));

vi.mock("@/supabase/queries/briefings", () => ({ getBriefingById }));
vi.mock("@/supabase/queries/modulesRegistry", () => ({ getUserWorkspaceId }));
vi.mock("@/supabase/queries/briefingExports", () => ({
  getNextBriefingExportVersion,
  createBriefingExport,
  getBriefingExportById,
  updateBriefingExport
}));
vi.mock("@/supabase/queries/modules", () => ({ listModules }));
vi.mock("@/supabase/queries/profiles", () => ({ getUserPlan }));
vi.mock("@/supabase/queries/usage", () => ({ consumePdfExport, getCurrentMonthUsage }));
vi.mock("@/pdf/renderBriefingPdf", () => ({ renderBriefingPdf }));

describe("frontend /api/briefings/:id/export routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    updateEq.mockResolvedValue({ error: null });
    requireUser.mockResolvedValue({ client: { from: () => ({ update }) }, userId: "u1" });
    getUserWorkspaceId.mockResolvedValue("workspace-1");
    getBriefingById.mockResolvedValue({
      id: "briefing-1",
      workspace_id: "workspace-1",
      title: "Festival Main Stage",
      status: "draft",
      shared: false,
      event_date: null,
      location_text: null
    });
  });

  it("creates an export job with the next version", async () => {
    getNextBriefingExportVersion.mockResolvedValue(3);
    createBriefingExport.mockResolvedValue({
      id: "export-3",
      version: 3,
      status: "creating"
    });

    const mod = await import("../../app/api/briefings/[id]/export/route");
    const response = await mod.POST(new Request("http://localhost/api/briefings/briefing-1/export", {
      method: "POST",
      headers: { authorization: "Bearer token" }
    }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });

    expect(response.status).toBe(200);
    expect(createBriefingExport).toHaveBeenCalledWith(expect.anything(), {
      workspace_id: "workspace-1",
      briefing_id: "11111111-1111-1111-1111-111111111111",
      version: 3,
      file_path: "briefings/11111111-1111-1111-1111-111111111111/exports/v3.pdf",
      status: "creating",
      error_message: null,
      created_by: "u1"
    });
  });

  it("generates a pdf and marks the export as ready", async () => {
    getBriefingExportById.mockResolvedValue({
      id: "export-1",
      workspace_id: "workspace-1",
      briefing_id: "11111111-1111-1111-1111-111111111111",
      version: 2,
      file_path: "briefings/11111111-1111-1111-1111-111111111111/exports/v2.pdf",
      status: "creating",
      error_message: null
    });
    getUserPlan.mockResolvedValue("pro");
    consumePdfExport.mockResolvedValue({ allowed: true, used: 1 });
    listModules.mockResolvedValue([]);
    renderBriefingPdf.mockResolvedValue(new Uint8Array([1, 2, 3]));
    upload.mockResolvedValue({ error: null });
    updateBriefingExport.mockResolvedValue({
      id: "export-1",
      status: "ready",
      version: 2,
      file_path: "briefings/11111111-1111-1111-1111-111111111111/exports/v2.pdf"
    });

    const mod = await import("../../app/api/briefings/[id]/export/[exportId]/generate/route");
    const response = await mod.POST(new Request("http://localhost/api/briefings/briefing-1/export/export-1/generate", {
      method: "POST",
      headers: { authorization: "Bearer token" }
    }), {
      params: Promise.resolve({
        id: "11111111-1111-1111-1111-111111111111",
        exportId: "22222222-2222-2222-2222-222222222222"
      })
    });

    expect(response.status).toBe(200);
    expect(upload).toHaveBeenCalled();
    expect(updateBriefingExport).toHaveBeenCalledWith(expect.anything(), "22222222-2222-2222-2222-222222222222", {
      status: "generating",
      error_message: null
    });
  });
});
