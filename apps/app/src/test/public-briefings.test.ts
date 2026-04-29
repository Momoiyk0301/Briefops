import { describe, expect, it } from "vitest";

import { buildPublicBriefingSections } from "@/lib/publicBriefings";
import { BriefingModuleRow } from "@/lib/types";

function createModuleRow(module_key: BriefingModuleRow["module_key"], audience: { mode: "all" | "teams"; teams: string[]; visibility: "visible" | "hidden" }, data: unknown): BriefingModuleRow {
  return {
    id: `${module_key}-1`,
    briefing_id: "briefing-1",
    module_key,
    enabled: true,
    data_json: {
      metadata: { enabled: true },
      audience,
      layout: {},
      data
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

describe("public briefing visibility", () => {
  it("hides team-only modules from the general staff view", () => {
    const modules = [
      createModuleRow("access", { mode: "teams", teams: ["sound"], visibility: "visible" }, {
        address: "Dock 3",
        parking: "P2",
        entrance: "Gate A",
        on_site_contact: "Sam"
      })
    ];

    expect(buildPublicBriefingSections(modules)).toEqual([]);
  });

  it("shows targeted modules in the matching audience view", () => {
    const modules = [
      createModuleRow("access", { mode: "teams", teams: ["sound"], visibility: "visible" }, {
        address: "Dock 3",
        parking: "P2",
        entrance: "Gate A",
        on_site_contact: "Sam"
      })
    ];

    const sections = buildPublicBriefingSections(modules, "sound");
    expect(sections).toHaveLength(1);
    expect(sections[0]?.id).toBe("access");
    expect(sections[0]?.items.join(" ")).toContain("Dock 3");
  });

  it("does not show targeted modules for a different audience tag", () => {
    const modules = [
      createModuleRow("access", { mode: "teams", teams: ["sound"], visibility: "visible" }, {
        address: "Dock 3",
        parking: "P2",
        entrance: "Gate A",
        on_site_contact: "Sam"
      })
    ];

    expect(buildPublicBriefingSections(modules, "logistics")).toEqual([]);
  });
});
