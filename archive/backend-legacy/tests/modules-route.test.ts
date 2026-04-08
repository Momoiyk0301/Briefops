import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getUserWorkspaceId = vi.fn();
const ensureRegistryModules = vi.fn();
const updateRegistryModuleEnabled = vi.fn();

vi.mock("@/supabase/server", () => ({ requireUser }));
vi.mock("@/supabase/queries/modulesRegistry", () => ({
  getUserWorkspaceId,
  ensureRegistryModules,
  updateRegistryModuleEnabled
}));

describe("/api/modules", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists modules using workspace_modules overrides", async () => {
    requireUser.mockResolvedValueOnce({ client: {}, userId: "u1" });
    getUserWorkspaceId.mockResolvedValueOnce("ws-1");
    ensureRegistryModules.mockResolvedValueOnce([{ id: "m1", type: "notes", workspace_enabled: true }]);

    const mod = await import("../app/api/modules/route");
    const response = await mod.GET(new Request("http://localhost/api/modules", { headers: { authorization: "Bearer token" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getUserWorkspaceId).toHaveBeenCalledWith({}, "u1");
    expect(ensureRegistryModules).toHaveBeenCalledWith({}, "ws-1");
    expect(body.data[0].id).toBe("m1");
  });

  it("updates a workspace module flag", async () => {
    requireUser.mockResolvedValueOnce({ client: {}, userId: "u1" });
    getUserWorkspaceId.mockResolvedValueOnce("ws-1");
    updateRegistryModuleEnabled.mockResolvedValueOnce({ id: "m1", enabled: false, workspace_enabled: false });

    const mod = await import("../app/api/modules/route");
    const response = await mod.PUT(
      new Request("http://localhost/api/modules", {
        method: "PUT",
        body: JSON.stringify({ id: "11111111-1111-1111-1111-111111111111", enabled: false }),
        headers: { "content-type": "application/json", authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(200);
    expect(updateRegistryModuleEnabled).toHaveBeenCalledWith({}, "ws-1", "11111111-1111-1111-1111-111111111111", false);
  });
});
