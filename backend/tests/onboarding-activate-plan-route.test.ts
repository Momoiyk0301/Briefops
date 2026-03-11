import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthContext = vi.fn();
const adminFrom = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireAuthContext,
  createServiceRoleClient: () => ({
    from: adminFrom
  })
}));

describe("/api/onboarding/activate-plan", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("activates the starter plan directly in database", async () => {
    const membershipMaybeSingle = vi.fn().mockResolvedValue({
      data: { workspace_id: "ws-1", role: "owner" },
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

    const profilesUpsert = vi.fn().mockResolvedValue({ error: null });
    const profilesUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const membershipsUpdateEq = vi.fn().mockResolvedValue({ error: null });

    adminFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          upsert: profilesUpsert,
          update: () => ({ eq: profilesUpdateEq })
        };
      }
      if (table === "memberships") {
        return {
          update: () => ({ eq: membershipsUpdateEq })
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const mod = await import("../app/api/onboarding/activate-plan/route");
    const response = await mod.POST(
      new Request("http://localhost/api/onboarding/activate-plan", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({ plan: "starter" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.onboarding_step).toBe("demo");
    expect(profilesUpdateEq).toHaveBeenCalled();
    expect(membershipsUpdateEq).toHaveBeenCalled();
  });
});
