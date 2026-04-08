import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const upload = vi.fn();
const createSignedUrl = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser,
  createServiceRoleClient: () => ({
    storage: {
      from: () => ({
        upload,
        createSignedUrl
      })
    }
  })
}));

describe("/api/storage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uploads files under the authenticated user path", async () => {
    requireUser.mockResolvedValueOnce({ userId: "user-1" });
    upload.mockResolvedValueOnce({ error: null });

    const mod = await import("../app/api/storage/upload/route");
    const formData = new FormData();
    formData.set("bucket", "assets");
    formData.set("file", new File(["hello"], "brief.pdf", { type: "application/pdf" }));

    const response = await mod.POST(
      new Request("http://localhost/api/storage/upload", {
        method: "POST",
        body: formData,
        headers: { authorization: "Bearer token" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.path.startsWith("user-1/")).toBe(true);
    expect(upload).toHaveBeenCalledTimes(1);
  });

  it("returns 403 when signed url path is outside the user scope", async () => {
    requireUser.mockResolvedValueOnce({ userId: "user-1" });

    const mod = await import("../app/api/storage/signed-url/route");
    const response = await mod.GET(
      new Request("http://localhost/api/storage/signed-url?bucket=assets&path=user-2/file.pdf", {
        headers: { authorization: "Bearer token" }
      })
    );

    expect(response.status).toBe(403);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("creates a signed url for the authenticated user path", async () => {
    requireUser.mockResolvedValueOnce({ userId: "user-1" });
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: "https://signed.test/file.pdf" }, error: null });

    const mod = await import("../app/api/storage/signed-url/route");
    const response = await mod.GET(
      new Request("http://localhost/api/storage/signed-url?bucket=assets&path=user-1/file.pdf", {
        headers: { authorization: "Bearer token" }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe("https://signed.test/file.pdf");
  });
});
