import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const getBriefingById = vi.fn();
const updateBriefing = vi.fn();
const deleteBriefing = vi.fn();

vi.mock("@/supabase/server", () => ({
  requireUser
}));

vi.mock("@/supabase/queries/briefings", () => ({
  getBriefingById,
  updateBriefing,
  deleteBriefing
}));

describe("/api/briefings/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("gets a briefing by id", async () => {
    requireUser.mockResolvedValueOnce({ client: {}, userId: "u1" });
    getBriefingById.mockResolvedValueOnce({ id: "b1" });

    const mod = await import("../app/api/briefings/[id]/route");
    const response = await mod.GET(new Request("http://localhost/api/briefings/b1", { headers: { authorization: "Bearer token" } }), {
      params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe("b1");
  });

  it("updates and deletes a briefing", async () => {
    requireUser.mockResolvedValue({ client: {}, userId: "u1" });
    updateBriefing.mockResolvedValueOnce({ id: "b1", title: "Updated" });

    const mod = await import("../app/api/briefings/[id]/route");
    const patchResponse = await mod.PATCH(
      new Request("http://localhost/api/briefings/b1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
        headers: { "content-type": "application/json", authorization: "Bearer token" }
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );
    const patchBody = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patchBody.data.title).toBe("Updated");

    const deleteResponse = await mod.DELETE(
      new Request("http://localhost/api/briefings/b1", {
        method: "DELETE",
        headers: { authorization: "Bearer token" }
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );

    expect(deleteResponse.status).toBe(200);
    expect(deleteBriefing).toHaveBeenCalled();
  });
});
