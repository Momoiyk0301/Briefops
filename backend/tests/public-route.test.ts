import { beforeEach, describe, expect, it, vi } from "vitest";

const createPublicTokenClient = vi.fn();
const getBriefingByPublicToken = vi.fn();

vi.mock("@/supabase/server", () => ({
  createPublicTokenClient
}));

vi.mock("@/supabase/queries/publicLinks", () => ({
  getBriefingByPublicToken
}));

describe("/api/public/:token", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects invalid token format", async () => {
    const mod = await import("../app/api/public/[token]/route");
    const response = await mod.GET(new Request("http://localhost/api/public/x"), { params: Promise.resolve({ token: "x" }) });
    expect(response.status).toBe(400);
  });

  it("returns 500 when protected lookup fails", async () => {
    createPublicTokenClient.mockReturnValueOnce({});
    getBriefingByPublicToken.mockRejectedValueOnce(new Error("not found"));

    const mod = await import("../app/api/public/[token]/route");
    const response = await mod.GET(new Request("http://localhost/api/public/abcdefghij"), {
      params: Promise.resolve({ token: "abcdefghij" })
    });

    expect(response.status).toBe(500);
  });
});
