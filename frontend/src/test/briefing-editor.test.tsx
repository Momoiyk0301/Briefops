import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { BriefingEditor } from "@/components/briefing/BriefingEditor";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  listBriefingShareLinks: vi.fn().mockResolvedValue([]),
  createBriefingShareLink: vi.fn(),
  revokeBriefingShareLink: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  listBriefingShareLinks: apiMocks.listBriefingShareLinks,
  createBriefingShareLink: apiMocks.createBriefingShareLink,
  revokeBriefingShareLink: apiMocks.revokeBriefingShareLink,
  patchBriefing: vi.fn().mockResolvedValue({}),
  toApiMessage: vi.fn((e: unknown) => String(e)),
  upsertBriefingModules: vi.fn().mockResolvedValue([])
}));

describe("BriefingEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn(() => "blob:test");
    window.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: vi.fn() }
    });
  });

  const briefing: Briefing = {
    id: "11111111-1111-1111-1111-111111111111",
    workspace_id: "22222222-2222-2222-2222-222222222222",
    title: "Demo briefing",
    status: "draft",
    shared: false,
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

  it("switches tabs and shows the selected module form", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    expect(screen.getByRole("button", { name: /^General$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Event name/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^(Access|Accès)$/i }));
    expect(screen.getAllByPlaceholderText(/Address/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /^Notes$/i }));

    expect(screen.getAllByPlaceholderText(/^Notes$/i).length).toBeGreaterThan(0);
  });

  it("shows the configuration sidebar sections", () => {
    render(<BriefingEditor briefing={briefing} modules={modules} />);
    expect(screen.getAllByText(/Configuration/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Module settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Module library/i)).toBeInTheDocument();
  });

  it("routes PDF export through the team-aware export page", async () => {
    const user = userEvent.setup();

    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: /Export PDF/i }));
    expect(window.location.assign).toHaveBeenCalledWith(`/briefings/${briefing.id}/export`);
  });

  it("opens share drawer and loads links for the current briefing", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: /^Share$/i }));
    expect(await screen.findByRole("heading", { name: /Share briefing/i })).toBeInTheDocument();
    expect(apiMocks.listBriefingShareLinks).toHaveBeenCalledWith(briefing.id);
  });

  it("shows subtle saved indicator after autosave", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    const titleInput = screen.getByLabelText(/Event name/i);
    await user.type(titleInput, " updated");

    await waitFor(() => {
      expect(screen.getByText(/Enregistré/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("adds a page and lets the selected module move to page 2 from configuration", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: "toggle-visual-editor" }));
    await user.click(screen.getByRole("button", { name: /(Access|Accès)/i }));
    await user.click(screen.getByRole("button", { name: /Add page/i }));
    await user.selectOptions(screen.getByRole("combobox", { name: /page-selector/i }), "1");

    expect(screen.getAllByText(/Page 2/i).length).toBeGreaterThan(0);
  }, 10000);

  it("opens the preview modal from the header action", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: /^Preview$/i }));
    expect(screen.getByLabelText("close-preview")).toBeInTheDocument();
    expect(screen.getAllByText(/^Preview$/i).length).toBeGreaterThan(0);
  });
});
