import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const listPublicLinks = vi.fn();
const createPublicLink = vi.fn();
const revokePublicLink = vi.fn();
const adminMaybeSingle = vi.fn();
const adminCreateSignedUrl = vi.fn();

vi.mock("@/env", () => ({
  env: { APP_URL: "http://localhost:3000" }
}));

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: adminMaybeSingle
        })
      })
    }),
    storage: {
      from: () => ({
        createSignedUrl: adminCreateSignedUrl
      })
    }
  })
}));

vi.mock("@/supabase/queries/publicLinks", () => ({
  listPublicLinks,
  createPublicLink,
  revokePublicLink
}));

describe("frontend /api/briefings/:id/share", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    adminMaybeSingle.mockResolvedValue({
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        created_by: "u1",
        pdf_path: "u1/b1/briefing.pdf"
      },
      error: null
    });
    adminCreateSignedUrl.mockResolvedValue({ data: { signedUrl: "https://example.test/signed.pdf" }, error: null });
  });

  it("creates a pdf public link with duration and supports multiple links", async () => {
    const client = {
      from: () => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          single: () => Promise.resolve({ data: { workspace_id: "org-1" }, error: null }),
          maybeSingle: () => Promise.resolve({ data: { role: "owner" }, error: null })
        };
        return chain;
      }
    };
    requireUser.mockResolvedValue({ client, userId: "u1" });
    listPublicLinks.mockResolvedValue([
      { id: "l1", briefing_id: "b1", token: "t1", resource_type: "pdf", created_by: "u1", expires_at: null, revoked_at: null, created_at: "", status: "active" },
      { id: "l2", briefing_id: "b1", token: "t2", resource_type: "pdf", created_by: "u1", expires_at: null, revoked_at: null, created_at: "", status: "active" }
    ]);
    createPublicLink.mockResolvedValue({
      id: "l3",
      briefing_id: "b1",
      token: "t3",
      resource_type: "pdf",
      created_by: "u1",
      expires_at: null,
      revoked_at: null,
      created_at: "",
      status: "active"
    });

    const mod = await import("../../app/api/briefings/[id]/share/route");
    const getRes = await mod.GET(new Request("http://localhost/api/briefings/b1/share", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data).toHaveLength(2);

    const postRes = await mod.POST(
      new Request("http://localhost/api/briefings/b1/share", {
        method: "POST",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({ duration: "24h" })
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );

    expect(postRes.status).toBe(201);
    expect(createPublicLink).toHaveBeenCalledTimes(1);
    expect(createPublicLink.mock.calls[0][3]).toBeTruthy();
  });

  it("revokes a share link", async () => {
    const client = {
      from: () => {
        const chain = {
          select: () => chain,
          eq: () => chain,
          in: () => chain,
          single: () => Promise.resolve({ data: { workspace_id: "org-1" }, error: null }),
          maybeSingle: () => Promise.resolve({ data: { role: "owner" }, error: null })
        };
        return chain;
      }
    };
    requireUser.mockResolvedValue({ client, userId: "u1" });
    revokePublicLink.mockResolvedValue({
      id: "l1",
      briefing_id: "11111111-1111-1111-1111-111111111111",
      status: "revoked"
    });

    const mod = await import("../../app/api/briefings/[id]/share/route");
    const res = await mod.DELETE(
      new Request("http://localhost/api/briefings/b1/share", {
        method: "DELETE",
        headers: { authorization: "Bearer token", "content-type": "application/json" },
        body: JSON.stringify({ link_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" })
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );

    expect(res.status).toBe(200);
  });
});
