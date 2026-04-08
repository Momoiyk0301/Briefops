import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getUserPlan = vi.fn();
const getWorkspaceForUser = vi.fn();
const upload = vi.fn();
const workspaceUpdateEq = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient: () => ({
    storage: {
      from: () => ({ upload })
    },
    from: () => ({
      update: () => ({
        eq: workspaceUpdateEq
      })
    })
  })
}));

vi.mock("@/supabase/queries/profiles", () => ({
  getUserPlan
}));

vi.mock("@/supabase/queries/workspaces", () => ({
  getWorkspaceForUser
}));

describe("frontend /api/storage/upload", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireUser.mockResolvedValue({ client: {}, userId: "u1" });
    getUserPlan.mockResolvedValue("starter");
    getWorkspaceForUser.mockResolvedValue({
      id: "w1",
      storage_used_bytes: 0,
      briefings_count: 0,
      pdf_exports_month: 0,
      pdf_exports_reset_at: new Date().toISOString()
    });
    upload.mockResolvedValue({ error: null });
    workspaceUpdateEq.mockResolvedValue({ error: null });
  });

  it("blocks invalid logo file types", async () => {
    const formData = new FormData();
    formData.append("bucket", "logos");
    formData.append("file", new File(["bad"], "logo.txt", { type: "text/plain" }));

    const mod = await import("../../app/api/storage/upload/route");
    const response = await mod.POST({
      headers: new Headers({ authorization: "Bearer token" }),
      formData: async () => formData
    } as unknown as Request);

    expect(response.status).toBe(400);
  });

  it("blocks storage upload when quota is exceeded", async () => {
    getWorkspaceForUser.mockResolvedValueOnce({
      id: "w1",
      storage_used_bytes: 20 * 1024 * 1024,
      briefings_count: 0,
      pdf_exports_month: 0,
      pdf_exports_reset_at: new Date().toISOString()
    });

    const formData = new FormData();
    formData.append("bucket", "avatars");
    formData.append("file", new File(["x"], "avatar.png", { type: "image/png" }));

    const mod = await import("../../app/api/storage/upload/route");
    const response = await mod.POST({
      headers: new Headers({ authorization: "Bearer token" }),
      formData: async () => formData
    } as unknown as Request);

    expect(response.status).toBe(402);
  });
});
