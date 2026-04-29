import { describe, expect, it } from "vitest";

import { resolveAudienceBriefingByToken, resolveStaffBriefingByToken } from "@/supabase/queries/publicLinks";
import { BriefingModuleRow } from "@/lib/types";

function createClient(input: {
  links: Array<Record<string, unknown>>;
  briefingId?: string;
  modules?: BriefingModuleRow[];
}) {
  return {
    from(table: string) {
      const filters = new Map<string, unknown>();

      if (table === "public_links") {
        const chain = {
          select: () => chain,
          eq: (field: string, value: unknown) => {
            filters.set(field, value);
            return chain;
          },
          maybeSingle: async () => ({
            data:
              input.links.find((link) =>
                Array.from(filters.entries()).every(([field, value]) => link[field] === value)
              ) ?? null,
            error: null
          })
        };
        return chain;
      }

      if (table === "briefings") {
        const chain = {
          select: () => chain,
          eq: (_field: string, value: unknown) => {
            filters.set("id", value);
            return chain;
          },
          single: async () => ({
            data:
              filters.get("id") === input.briefingId
                ? {
                    id: input.briefingId,
                    workspace_id: "org-1",
                    title: "Festival",
                    status: "ready",
                    shared: true,
                    event_date: "2026-03-11",
                    location_text: "Brussels",
                    created_by: "u1",
                    created_at: "",
                    updated_at: ""
                  }
                : null,
            error: null
          })
        };
        return chain;
      }

      if (table === "briefing_modules") {
        const chain = {
          select: () => chain,
          eq: (_field: string, value: unknown) => {
            filters.set("briefing_id", value);
            return chain;
          },
          order: async () => ({
            data: filters.get("briefing_id") === input.briefingId ? input.modules ?? [] : [],
            error: null
          })
        };
        return chain;
      }

      throw new Error(`Unexpected table ${table}`);
    }
  };
}

const baseLink = {
  id: "link-1",
  briefing_id: "briefing-1",
  resource_type: "pdf",
  token: "token-1",
  created_by: "u1",
  expires_at: null,
  revoked_at: null,
  created_at: ""
};

describe("public link resolution", () => {
  it("resolves a valid staff link", async () => {
    const client = createClient({
      briefingId: "briefing-1",
      links: [{ ...baseLink, link_type: "staff", audience_tag: null }]
    });

    const resolved = await resolveStaffBriefingByToken(client as never, "token-1");
    expect(resolved?.resolvedView).toBe("staff");
    expect(resolved?.briefing.id).toBe("briefing-1");
  });

  it("resolves a valid audience link with the matching tag", async () => {
    const client = createClient({
      briefingId: "briefing-1",
      links: [{ ...baseLink, link_type: "audience", audience_tag: "sound" }]
    });

    const resolved = await resolveAudienceBriefingByToken(client as never, "briefing-1", "sound", "token-1");
    expect(resolved?.resolvedView).toBe("audience");
    expect(resolved?.audienceTag).toBe("sound");
  });

  it("rejects an audience link when the tag does not match", async () => {
    const client = createClient({
      briefingId: "briefing-1",
      links: [{ ...baseLink, link_type: "audience", audience_tag: "sound" }]
    });

    const resolved = await resolveAudienceBriefingByToken(client as never, "briefing-1", "logistics", "token-1");
    expect(resolved).toBeNull();
  });

  it("rejects an expired link", async () => {
    const client = createClient({
      briefingId: "briefing-1",
      links: [{ ...baseLink, link_type: "staff", audience_tag: null, expires_at: "2020-01-01T00:00:00.000Z" }]
    });

    const resolved = await resolveStaffBriefingByToken(client as never, "token-1");
    expect(resolved).toBeNull();
  });

  it("rejects a revoked link", async () => {
    const client = createClient({
      briefingId: "briefing-1",
      links: [{ ...baseLink, link_type: "staff", audience_tag: null, revoked_at: "2026-03-11T00:00:00.000Z" }]
    });

    const resolved = await resolveStaffBriefingByToken(client as never, "token-1");
    expect(resolved).toBeNull();
  });
});
