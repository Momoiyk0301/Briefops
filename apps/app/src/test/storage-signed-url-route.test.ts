import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getUserWorkspaceId = vi.fn();
const createSignedUrl = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn();
const select = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient: () => ({
    storage: {
      from: () => ({ createSignedUrl })
    },
    from: () => ({
      select
    })
  })
}));

vi.mock("@/supabase/queries/modulesRegistry", () => ({
  getUserWorkspaceId
}));

describe("frontend /api/storage/signed-url", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireUser.mockResolvedValue({ client: {}, userId: "u1" });
    getUserWorkspaceId.mockResolvedValue("w1");
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://example.test/signed" }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    eq.mockReturnValue({ eq, maybeSingle });
    select.mockReturnValue({ eq });
  });

  it("signs an avatar path owned by the current user", async () => {
    const mod = await import("../../app/api/storage/signed-url/route");
    const response = await mod.GET(
      new Request("http://localhost/api/storage/signed-url?bucket=avatars&path=user/u1/avatar.png", {
        headers: { authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(200);
    expect(createSignedUrl).toHaveBeenCalledWith("user/u1/avatar.png", 3600);
  });

  it("rejects an avatar path owned by another user", async () => {
    const mod = await import("../../app/api/storage/signed-url/route");
    const response = await mod.GET(
      new Request("http://localhost/api/storage/signed-url?bucket=avatars&path=user/u2/avatar.png", {
        headers: { authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(403);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("signs an export path linked to the current workspace", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "export-1" }, error: null });

    const mod = await import("../../app/api/storage/signed-url/route");
    const response = await mod.GET(
      new Request("http://localhost/api/storage/signed-url?bucket=exports&path=briefings/b1/exports/v1.pdf", {
        headers: { authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(200);
    expect(createSignedUrl).toHaveBeenCalledWith("briefings/b1/exports/v1.pdf", 3600);
  });

  it("rejects an export path that is not attached to the current workspace", async () => {
    const mod = await import("../../app/api/storage/signed-url/route");
    const response = await mod.GET(
      new Request("http://localhost/api/storage/signed-url?bucket=exports&path=briefings/b2/exports/v1.pdf", {
        headers: { authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(403);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
