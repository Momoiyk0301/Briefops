import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const listStaffByWorkspace = vi.fn();
const createStaff = vi.fn();
const getStaffById = vi.fn();
const updateStaff = vi.fn();
const deleteStaff = vi.fn();

vi.mock("@/supabase/server", () => ({ requireUser }));
vi.mock("@/supabase/queries/staff", () => ({
  listStaffByWorkspace,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff
}));

describe("/api/staff", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists staff for the current workspace", async () => {
    const maybeSingle = vi.fn().mockResolvedValueOnce({ data: { workspace_id: "ws-1" }, error: null });
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle }))
        }))
      }))
    };
    requireUser.mockResolvedValueOnce({ client, userId: "u1" });
    listStaffByWorkspace.mockResolvedValueOnce([{ id: "s1" }]);

    const mod = await import("../app/api/staff/route");
    const response = await mod.GET(new Request("http://localhost/api/staff", { headers: { authorization: "Bearer token" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listStaffByWorkspace).toHaveBeenCalledWith(client, "ws-1");
    expect(body.data[0].id).toBe("s1");
  });

  it("updates and deletes staff in the same workspace", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { workspace_id: "ws-1" }, error: null });
    const client = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle }))
        }))
      }))
    };

    requireUser.mockResolvedValue({ client, userId: "u1" });
    getStaffById.mockResolvedValue({ id: "s1", workspace_id: "ws-1" });
    updateStaff.mockResolvedValue({ id: "s1", workspace_id: "ws-1" });

    const modById = await import("../app/api/staff/[id]/route");
    const patchResponse = await modById.PATCH(
      new Request("http://localhost/api/staff/s1", {
        method: "PATCH",
        body: JSON.stringify({ role: "lead" }),
        headers: { "content-type": "application/json", authorization: "Bearer token" }
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );

    expect(patchResponse.status).toBe(200);
    expect(updateStaff).toHaveBeenCalled();

    const deleteResponse = await modById.DELETE(
      new Request("http://localhost/api/staff/s1", {
        method: "DELETE",
        headers: { authorization: "Bearer token" }
      }),
      { params: Promise.resolve({ id: "11111111-1111-1111-1111-111111111111" }) }
    );

    expect(deleteResponse.status).toBe(200);
    expect(deleteStaff).toHaveBeenCalled();
  });
});
