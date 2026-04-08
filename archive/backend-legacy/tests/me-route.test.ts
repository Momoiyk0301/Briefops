import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthContext = vi.fn();
const getCurrentMonthUsage = vi.fn();

vi.mock("@/supabase/server", () => ({ requireAuthContext }));
vi.mock("@/supabase/queries/usage", () => ({ getCurrentMonthUsage }));

describe("/api/me", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns workspace and usage information", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: { plan: "starter", subscription_name: null, subscription_status: null, stripe_price_id: null, current_period_end: null, onboarding_step: "done" }, error: null })
      .mockResolvedValueOnce({ data: { workspace_id: "ws-1", role: "owner" }, error: null })
      .mockResolvedValueOnce({ data: { id: "ws-1", name: "Workspace" }, error: null });

    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle }))
        }))
      }))
    };

    requireAuthContext.mockResolvedValueOnce({ client, userId: "u1", email: "ops@briefops.app" });
    getCurrentMonthUsage.mockResolvedValueOnce({ pdf_exports: 2 });

    const mod = await import("../app/api/me/route");
    const response = await mod.GET(new Request("http://localhost/api/me", { headers: { authorization: "Bearer token" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.workspace.name).toBe("Workspace");
    expect(body.role).toBe("owner");
    expect(body.usage.pdf_exports_used).toBe(2);
  });
});
