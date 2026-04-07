import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getBriefingById = vi.fn();
const getNextBriefingExportVersion = vi.fn();
const createBriefingExport = vi.fn();
const getUserWorkspaceId = vi.fn();
const listModules = vi.fn();
const consumePdfExport = vi.fn();
const getCurrentMonthUsage = vi.fn();
const renderBriefingPdf = vi.fn();
const getUserPlan = vi.fn();
const getWorkspaceById = vi.fn();
const upload = vi.fn();
const createSignedUrl = vi.fn();
const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient: () => ({
    from: () => ({
      update
    }),
    storage: {
      from: () => ({ upload, createSignedUrl })
    }
  })
}));
vi.mock("@/supabase/queries/briefings", () => ({ getBriefingById }));
vi.mock("@/supabase/queries/briefingExports", () => ({ getNextBriefingExportVersion, createBriefingExport }));
vi.mock("@/supabase/queries/modulesRegistry", () => ({ getUserWorkspaceId }));
vi.mock("@/supabase/queries/modules", () => ({ listModules }));
vi.mock("@/supabase/queries/usage", () => ({ consumePdfExport, getCurrentMonthUsage }));
vi.mock("@/supabase/queries/profiles", () => ({ getUserPlan }));
vi.mock("@/pdf/renderBriefingPdf", () => ({ renderBriefingPdf }));
vi.mock("@/supabase/queries/workspaces", () => ({ getWorkspaceById }));
vi.mock("@/server/rateLimit", () => ({
  enforceRateLimit: vi.fn(() => ({ allowed: true, remaining: 11, resetAt: Date.now() + 60_000 })),
  resolveRateLimitKey: vi.fn(() => "pdf:u1:test")
}));

describe("frontend /api/pdf/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    updateEq.mockResolvedValue({ error: null });
    getUserWorkspaceId.mockResolvedValue("org-1");
    getWorkspaceById.mockResolvedValue({
      id: "org-1",
      name: "Ops",
      briefings_count: 0,
      storage_used_bytes: 0,
      pdf_exports_month: 0,
      pdf_exports_reset_at: new Date().toISOString()
    });
    getNextBriefingExportVersion.mockResolvedValue(1);
    createBriefingExport.mockResolvedValue({ id: "export-1", version: 1, file_path: "briefings/b1/exports/v1.pdf" });
  });

  it("returns json payload when format=json", async () => {
    requireUser.mockResolvedValueOnce({ client: { from: () => ({ update }) }, userId: "u1" });
    getBriefingById.mockResolvedValueOnce({ id: "b1", workspace_id: "org-1", title: "T", status: "draft", shared: false, event_date: null, location_text: null });
    listModules.mockResolvedValueOnce([]);
    getUserPlan.mockResolvedValueOnce("pro");
    renderBriefingPdf.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));
    upload.mockResolvedValueOnce({ error: null });
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: "https://example.test/file.pdf" }, error: null });

    const mod = await import("../../app/api/pdf/[id]/route");
    const response = await mod.GET(new Request("http://localhost/api/pdf/b1?format=json", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.pdf_url).toContain("example.test/file.pdf");
    expect(body.version).toBe(1);
    expect(body.export_id).toBe("export-1");
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][0]).toBe("briefings/b1/exports/v1.pdf");
    expect(renderBriefingPdf).toHaveBeenCalledWith(expect.objectContaining({ watermark: false }));
    expect(createBriefingExport).toHaveBeenCalledWith(expect.anything(), {
      workspace_id: "org-1",
      briefing_id: "b1",
      version: 1,
      file_path: "briefings/b1/exports/v1.pdf",
      status: undefined,
      error_message: undefined,
      created_by: "u1"
    });
  });

  it("returns 500 when storage upload fails", async () => {
    requireUser.mockResolvedValueOnce({ client: { from: () => ({ update }) }, userId: "u1" });
    getBriefingById.mockResolvedValueOnce({ id: "b1", workspace_id: "org-1", title: "T", status: "draft", shared: false, event_date: null, location_text: null });
    listModules.mockResolvedValueOnce([]);
    getUserPlan.mockResolvedValueOnce("pro");
    renderBriefingPdf.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));
    upload.mockResolvedValueOnce({ error: { message: "bucket missing" } });

    const mod = await import("../../app/api/pdf/[id]/route");
    const response = await mod.GET(new Request("http://localhost/api/pdf/b1?format=json", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });

    expect(response.status).toBe(500);
  });

  it("returns 403 when briefing belongs to another workspace", async () => {
    requireUser.mockResolvedValueOnce({ client: { from: () => ({ update }) }, userId: "u1" });
    getBriefingById.mockResolvedValueOnce({ id: "b1", workspace_id: "org-other", title: "T", status: "draft", shared: false, event_date: null, location_text: null });
    listModules.mockResolvedValueOnce([]);

    const mod = await import("../../app/api/pdf/[id]/route");
    const response = await mod.GET(new Request("http://localhost/api/pdf/b1?format=json", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });

    expect(response.status).toBe(403);
  });

  it("enables watermark for starter exports and blocks quota excess", async () => {
    requireUser.mockResolvedValue({ client: { from: () => ({ update }) }, userId: "u1" });
    getBriefingById.mockResolvedValueOnce({ id: "b1", workspace_id: "org-1", title: "T", status: "draft", shared: false, event_date: null, location_text: null });
    listModules.mockResolvedValueOnce([]);
    getUserPlan.mockResolvedValueOnce("starter");
    getWorkspaceById.mockResolvedValueOnce({
      id: "org-1",
      name: "Ops",
      briefings_count: 0,
      storage_used_bytes: 0,
      pdf_exports_month: 10,
      pdf_exports_reset_at: new Date().toISOString()
    });

    const mod = await import("../../app/api/pdf/[id]/route");
    const blocked = await mod.GET(new Request("http://localhost/api/pdf/b1?format=json", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });
    expect(blocked.status).toBe(402);

    getWorkspaceById.mockResolvedValueOnce({
      id: "org-1",
      name: "Ops",
      briefings_count: 0,
      storage_used_bytes: 0,
      pdf_exports_month: 0,
      pdf_exports_reset_at: new Date().toISOString()
    });
    getBriefingById.mockResolvedValueOnce({ id: "b1", workspace_id: "org-1", title: "T", status: "draft", shared: false, event_date: null, location_text: null });
    listModules.mockResolvedValueOnce([]);
    renderBriefingPdf.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));
    upload.mockResolvedValueOnce({ error: null });
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: "https://example.test/file.pdf" }, error: null });
    getUserPlan.mockResolvedValueOnce("starter");

    const allowed = await mod.GET(new Request("http://localhost/api/pdf/b1?format=json", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });

    expect(allowed.status).toBe(200);
    expect(renderBriefingPdf).toHaveBeenLastCalledWith(expect.objectContaining({ watermark: true }));
  });
});
