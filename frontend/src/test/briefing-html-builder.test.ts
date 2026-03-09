import { describe, expect, it } from "vitest";

import { buildBriefingHtml } from "@/pdf/buildBriefingHtml";

describe("buildBriefingHtml", () => {
  it("renders canonical module data using layout and hides module metadata", () => {
    const html = buildBriefingHtml({
      id: "b1",
      title: "Festival Ops",
      event_date: "2026-03-07",
      location_text: "Brussels",
      modules: [
        {
          module_key: "overview",
          enabled: true,
          data_json: {
            metadata: {
              type: "overview",
              label: "Apercu evenement",
              icon: "calendar",
              enabled: true
            },
            audience: {
              mode: "all",
              teams: [],
              visibility: "visible"
            },
            layout: {
              desktop: { x: 0, y: 0, w: 12, h: 3 }
            },
            data: {
              event_name: "Festival X",
              client: "Peak Events",
              location: {
                name: "Brussels Expo"
              }
            }
          }
        },
        {
          module_key: "notes",
          enabled: true,
          data_json: {
            metadata: { label: "Hidden module", enabled: true },
            audience: { visibility: "hidden" },
            layout: { desktop: { x: 0, y: 3, w: 12, h: 3 } },
            data: { text: "hidden" }
          }
        }
      ]
    });

    expect(html).toContain("Festival Ops");
    expect(html).toContain("Brussels");
    expect(html).toContain("Festival X");
    expect(html).toContain("Peak Events");
    expect(html).toContain("Brussels Expo");
    expect(html).toContain("Overview");
    expect(html).toContain("left:0%;top:0%;width:100%;height:12.5%;");
    expect(html).not.toContain("Apercu evenement");
    expect(html).not.toContain("calendar");
    expect(html).not.toContain(">hidden<");
  });

  it("groups modules by A4 page when desktop.page is set", () => {
    const html = buildBriefingHtml({
      id: "b2",
      title: "Paged Briefing",
      event_date: "2026-03-10",
      location_text: "Brussels Expo",
      modules: [
        {
          module_key: "staff",
          enabled: true,
          data_json: {
            metadata: { label: "Staff", enabled: true },
            audience: { mode: "all", teams: [], visibility: "visible" },
            layout: { desktop: { x: 0, y: 0, w: 12, h: 3, page: 0 } },
            data: { roles: [{ role: "FOH", count: 2, notes: "" }] }
          }
        },
        {
          module_key: "delivery",
          enabled: true,
          data_json: {
            metadata: { label: "Delivery", enabled: true },
            audience: { mode: "all", teams: [], visibility: "visible" },
            layout: { desktop: { x: 0, y: 0, w: 12, h: 3, page: 1 } },
            data: { deliveries: [{ place: "Etterbeek", contact: "Moise", time: "", notes: "" }] }
          }
        }
      ]
    });

    expect(html).toContain('data-page="1"');
    expect(html).toContain('data-page="2"');
    expect(html).toContain("Page 2 / 2");
    expect(html).toContain("Delivery");
  });
});
