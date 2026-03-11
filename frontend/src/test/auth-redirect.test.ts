import { describe, expect, it } from "vitest";

import { getPostAuthRedirect } from "@/lib/authRedirect";
import type { MeResponse } from "@/lib/types";

function buildMe(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    user: { id: "u1", email: "test@example.com" },
    plan: null,
    org: null,
    workspace: null,
    role: null,
    is_admin: false,
    degraded: false,
    onboarding_step: "workspace",
    ...overrides
  };
}

describe("getPostAuthRedirect", () => {
  it("returns onboarding for users without membership yet", () => {
    expect(getPostAuthRedirect(buildMe())).toBe("/onboarding");
  });

  it("returns pricing step when workspace exists but no paid plan is active", () => {
    expect(
      getPostAuthRedirect(
        buildMe({
          role: "owner",
          workspace: { id: "ws-1", name: "Org" },
          org: { id: "ws-1", name: "Org" },
          onboarding_step: "products"
        })
      )
    ).toBe("/onboarding?step=products");
  });

  it("returns briefings once onboarding is done", () => {
    expect(
      getPostAuthRedirect(
        buildMe({
          role: "owner",
          workspace: { id: "ws-1", name: "Org" },
          plan: "starter",
          onboarding_step: "done"
        })
      )
    ).toBe("/briefings");
  });
});
