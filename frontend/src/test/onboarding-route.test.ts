import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthContext = vi.fn();
const adminFrom = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireAuthContext,
  createServiceRoleClient: () => ({
    from: adminFrom
  })
}));

describe("frontend /api/onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates workspace + owner membership", async () => {
    const membershipMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: membershipMaybeSingle
          })
        })
      }))
    };
    requireAuthContext.mockResolvedValue({ client, userId: "u1", email: "u1@test.com" });

    const profilesUpsert = vi.fn().mockResolvedValue({ error: null });
    const profilesUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const workspacesSingle = vi.fn().mockResolvedValue({
      data: { id: "ws-1", name: "Team OPS", country: "Belgium", team_size: 10, vat_number: "BE123" },
      error: null
    });
    const membershipsInsert = vi.fn().mockResolvedValue({ error: null });

    adminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          upsert: profilesUpsert,
          update: () => ({ eq: profilesUpdateEq })
        };
      }
      if (table === "workspaces") {
        return {
          insert: () => ({
            select: () => ({
              single: workspacesSingle
            })
          })
        };
      }
      if (table === "memberships") {
        return {
          insert: membershipsInsert
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const mod = await import("../../app/api/onboarding/route");
    const response = await mod.POST(
      new Request("http://localhost/api/onboarding", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          workspace_name: "Team OPS",
          country: "Belgium",
          team_size: 10,
          vat_number: "BE123"
        })
      })
    );

    expect(response.status).toBe(201);
    expect(membershipsInsert).toHaveBeenCalledWith({
      workspace_id: "ws-1",
      user_id: "u1",
      role: "owner"
    });
  });

  it("updates onboarding step in profile", async () => {
    requireAuthContext.mockResolvedValue({
      client: { from: vi.fn() },
      userId: "u1",
      email: "u1@test.com"
    });

    const profilesUpdateEq = vi.fn().mockResolvedValue({ error: null });
    adminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          update: () => ({ eq: profilesUpdateEq })
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const mod = await import("../../app/api/onboarding/route");
    const response = await mod.POST(
      new Request("http://localhost/api/onboarding", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({ onboarding_step: "demo" })
      })
    );

    expect(response.status).toBe(200);
    expect(profilesUpdateEq).toHaveBeenCalled();
  });

  it("reuses the existing workspace instead of failing when membership already exists", async () => {
    const membershipMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "m1", org_id: "ws-1" },
      error: null
    });
    const client = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: membershipMaybeSingle
          })
        })
      }))
    };
    requireAuthContext.mockResolvedValue({ client, userId: "u1", email: "u1@test.com" });

    const profilesUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const workspacesMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "ws-1", name: "Team OPS", country: "Belgium", team_size: 10, vat_number: "BE123" },
      error: null
    });

    adminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          update: () => ({ eq: profilesUpdateEq })
        };
      }
      if (table === "workspaces") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: workspacesMaybeSingle
            })
          })
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const mod = await import("../../app/api/onboarding/route");
    const response = await mod.POST(
      new Request("http://localhost/api/onboarding", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          workspace_name: "Team OPS",
          country: "Belgium",
          team_size: 10,
          vat_number: "BE123"
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      onboarding_step: "products",
      reused_existing_workspace: true,
      workspace: { id: "ws-1", name: "Team OPS" }
    });
  });
});
