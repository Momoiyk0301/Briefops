import { beforeEach, describe, expect, it, vi } from "vitest";

const getActivePublicLinkWithPdfPath = vi.fn();
const createSignedUrl = vi.fn();

vi.mock("@/supabase/queries/publicLinks", () => ({
  PUBLIC_LINK_INVALID_MESSAGE: "This link has expired. Please ask the owner for a new link.",
  getActivePublicLinkWithPdfPath
}));

vi.mock("@/supabase/server", () => ({
  createServiceRoleClient: () => ({
    storage: {
      from: () => ({ createSignedUrl })
    }
  })
}));

describe("frontend /api/public/:token", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns signed pdf url when token is valid", async () => {
    getActivePublicLinkWithPdfPath.mockResolvedValue({
      pdfPath: "u1/b1/briefing.pdf",
      expiresAt: null
    });
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://example.test/pdf" }, error: null });

    const mod = await import("../../app/api/public/[token]/route");
    const res = await mod.GET(new Request("http://localhost/api/public/t"), { params: Promise.resolve({ token: "valid-token-123" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pdf_url).toContain("example.test/pdf");
  });

  it("rejects expired or revoked token", async () => {
    getActivePublicLinkWithPdfPath.mockResolvedValue(null);

    const mod = await import("../../app/api/public/[token]/route");
    const res = await mod.GET(new Request("http://localhost/api/public/t"), { params: Promise.resolve({ token: "expired-token-123" }) });

    expect(res.status).toBe(410);
  });
});

