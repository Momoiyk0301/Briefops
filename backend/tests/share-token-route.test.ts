import { beforeEach, describe, expect, it, vi } from "vitest";

const getActivePublicLinkWithPdfPath = vi.fn();
const createSignedUrl = vi.fn();

vi.mock("@/supabase/queries/publicLinks", () => ({
  getActivePublicLinkWithPdfPath
}));

vi.mock("@/supabase/server", () => ({
  createServiceRoleClient: () => ({
    storage: {
      from: () => ({
        createSignedUrl
      })
    }
  })
}));

describe("/share/:token", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("redirects to signed url when token is valid", async () => {
    getActivePublicLinkWithPdfPath.mockResolvedValueOnce({
      linkId: "l1",
      briefingId: "b1",
      pdfPath: "u1/b1/file.pdf"
    });
    createSignedUrl.mockResolvedValueOnce({
      data: { signedUrl: "https://example.test/signed.pdf" },
      error: null
    });

    const mod = await import("../app/share/[token]/route");
    const response = await mod.GET(new Request("http://localhost/share/11111111-1111-1111-1111-111111111111"), {
      params: Promise.resolve({ token: "11111111-1111-1111-1111-111111111111" })
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("https://example.test/signed.pdf");
  });
});
