import { describe, expect, it, vi } from "vitest";

import { syncBriefingSharedState } from "@/supabase/queries/briefings";

describe("syncBriefingSharedState", () => {
  it("sets shared to true when at least one active link exists", async () => {
    const or = vi.fn().mockResolvedValue({ count: 1, error: null });
    const is = vi.fn(() => ({ or }));
    const eqPublicLinks = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ eq: eqPublicLinks }));
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));

    const client = {
      from: (table: string) =>
        table === "public_links"
          ? { select }
          : table === "briefings"
            ? { update }
            : null
    };

    await syncBriefingSharedState(client as never, "briefing-1");

    expect(or).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ shared: true });
  });

  it("sets shared to false when no active link remains", async () => {
    const or = vi.fn().mockResolvedValue({ count: 0, error: null });
    const is = vi.fn(() => ({ or }));
    const eqPublicLinks = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ eq: eqPublicLinks }));
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq: updateEq }));

    const client = {
      from: (table: string) =>
        table === "public_links"
          ? { select }
          : table === "briefings"
            ? { update }
            : null
    };

    await syncBriefingSharedState(client as never, "briefing-1");

    expect(update).toHaveBeenCalledWith({ shared: false });
  });
});
