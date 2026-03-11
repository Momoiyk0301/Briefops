import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthContext = vi.fn();
const adminFrom = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireAuthContext,
  createServiceRoleClient: () => ({
    from: adminFrom
  })
}));

describe("/api/onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates workspace, membership, and advances onboarding step", async () => {
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

    const mod = await import("../app/api/onboarding/route");
    const response = await mod.POST(
      new Request("http://localhost/api/onboarding", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          workspace_name: "Team OPS",
          country: "Belgium",
          team_size: "10",
          vat_number: "BE123"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.onboarding_step).toBe("products");
    expect(membershipsInsert).toHaveBeenCalledWith({
      org_id: "ws-1",
      user_id: "u1",
      role: "owner"
    });
    expect(profilesUpdateEq).toHaveBeenCalled();
  });

  it("returns validation error when workspace_name is missing", async () => {
    requireAuthContext.mockResolvedValue({
      client: { from: vi.fn() },
      userId: "u1",
      email: "u1@test.com"
    });

    const mod = await import("../app/api/onboarding/route");
    const response = await mod.POST(
      new Request("http://localhost/api/onboarding", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          country: "Belgium",
          team_size: "",
          vat_number: ""
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Validation failed");
  });

  it("updates onboarding step without requiring workspace_name", async () => {
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

    const mod = await import("../app/api/onboarding/route");
    const response = await mod.POST(
      new Request("http://localhost/api/onboarding", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({ onboarding_step: "workspace" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.onboarding_step).toBe("workspace");
    expect(profilesUpdateEq).toHaveBeenCalled();
  });

  it("updates existing workspace and continues when membership already exists", async () => {
    const membershipMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "membership-1", org_id: "ws-1" },
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
    const workspaceSingle = vi.fn().mockResolvedValue({
      data: { id: "ws-1", name: "Team OPS 2", country: "Belgium", team_size: null, vat_number: null },
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
          update: () => ({
            eq: () => ({
              select: () => ({
                single: workspaceSingle
              })
            })
          })
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const mod = await import("../app/api/onboarding/route");
    const response = await mod.POST(
      new Request("http://localhost/api/onboarding", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({
          workspace_name: "Team OPS 2",
          country: "Belgium",
          team_size: "",
          vat_number: ""
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.onboarding_step).toBe("products");
    expect(profilesUpdateEq).toHaveBeenCalled();
  });
});
