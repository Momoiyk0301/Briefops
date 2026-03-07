import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { BriefingEditor } from "@/components/briefing/BriefingEditor";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  downloadPdf: vi.fn(),
  patchBriefing: vi.fn().mockResolvedValue({}),
  toApiMessage: vi.fn((e: unknown) => String(e)),
  upsertBriefingModules: vi.fn().mockResolvedValue([])
}));

describe("BriefingEditor", () => {
  const briefing: Briefing = {
    id: "11111111-1111-1111-1111-111111111111",
    org_id: "22222222-2222-2222-2222-222222222222",
    title: "Demo briefing",
    event_date: null,
    location_text: null,
    created_by: "33333333-3333-3333-3333-333333333333",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const modules: BriefingModuleRow[] = moduleEntries.map((entry, idx) => ({
    id: `m-${idx}`,
    briefing_id: briefing.id,
    module_key: entry.key,
    enabled: true,
    data_json: moduleRegistry[entry.key].defaultData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  it("opens selected module form in right sidebar when clicking module list item", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    expect(screen.getByText(/Edition module/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Address/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Notes/i }));

    expect(screen.getByPlaceholderText(/^Notes$/i)).toBeInTheDocument();
  });
});
