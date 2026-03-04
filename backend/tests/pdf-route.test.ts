import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getBriefingById = vi.fn();
const listModules = vi.fn();
const consumePdfExport = vi.fn();
const getCurrentMonthUsage = vi.fn();
const renderBriefingPdf = vi.fn();
const getUserPlan = vi.fn();
const upload = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient: () => ({
    storage: {
      from: () => ({ upload })
    }
  })
}));
vi.mock("@/supabase/queries/briefings", () => ({ getBriefingById }));
vi.mock("@/supabase/queries/modules", () => ({ listModules }));
vi.mock("@/supabase/queries/usage", () => ({ consumePdfExport, getCurrentMonthUsage }));
vi.mock("@/supabase/queries/profiles", () => ({ getUserPlan }));
vi.mock("@/pdf/renderBriefingPdf", () => ({ renderBriefingPdf }));

describe("/api/pdf/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 402 when free limit is reached", async () => {
    requireUser.mockResolvedValueOnce({ client: {}, userId: "u1" });
    getBriefingById.mockResolvedValueOnce({ id: "b1", title: "T", event_date: null, location_text: null });
    listModules.mockResolvedValueOnce([]);
    getUserPlan.mockResolvedValueOnce("free");
    consumePdfExport.mockResolvedValueOnce({ allowed: false, used: 3 });
    getCurrentMonthUsage.mockResolvedValueOnce({ pdf_exports: 3 });

    const mod = await import("../app/api/pdf/[id]/route");
    const response = await mod.GET(new Request("http://localhost/api/pdf/b1", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });

    expect(response.status).toBe(402);
  });

  it("returns a PDF when allowed", async () => {
    requireUser.mockResolvedValueOnce({ client: {}, userId: "u1" });
    getBriefingById.mockResolvedValueOnce({ id: "b1", title: "T", event_date: null, location_text: null });
    listModules.mockResolvedValueOnce([]);
    getUserPlan.mockResolvedValueOnce("pro");
    consumePdfExport.mockResolvedValueOnce({ allowed: true, used: 1 });
    renderBriefingPdf.mockResolvedValueOnce(new Uint8Array([1, 2, 3]));
    upload.mockResolvedValueOnce({ error: null });

    const mod = await import("../app/api/pdf/[id]/route");
    const response = await mod.GET(new Request("http://localhost/api/pdf/b1", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/pdf");
    expect(upload).toHaveBeenCalledTimes(1);
  });
});
