import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { BriefingEditor } from "@/components/briefing/BriefingEditor";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  generateBriefingPdf: vi.fn(),
  getStorageSignedUrl: vi.fn(),
  listBriefingShareLinks: vi.fn().mockResolvedValue([]),
  createBriefingShareLink: vi.fn(),
  revokeBriefingShareLink: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  generateBriefingPdf: apiMocks.generateBriefingPdf,
  getStorageSignedUrl: apiMocks.getStorageSignedUrl,
  listBriefingShareLinks: apiMocks.listBriefingShareLinks,
  createBriefingShareLink: apiMocks.createBriefingShareLink,
  revokeBriefingShareLink: apiMocks.revokeBriefingShareLink,
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

    expect(screen.getAllByText(/Edition module/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /Edition/i }));
    expect(screen.getAllByPlaceholderText(/Address/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("move-access")).toBeInTheDocument();
    expect(screen.queryByLabelText("move-notes")).not.toBeInTheDocument();

    const notesItem = screen
      .getAllByText(/^Notes$/i)
      .map((node) => node.closest('[role="button"]'))
      .find((node): node is HTMLElement => Boolean(node));
    expect(notesItem).toBeTruthy();
    await user.click(notesItem!);

    expect(screen.getAllByPlaceholderText(/^Notes$/i).length).toBeGreaterThan(0);
  });

  it("shows mobile panel tabs for meta/modules/edition", () => {
    render(<BriefingEditor briefing={briefing} modules={modules} />);
    expect(screen.getByRole("button", { name: "Meta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modules" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edition" })).toBeInTheDocument();
  });

  it("shows loading then displays the PDF icon link after generation", async () => {
    const user = userEvent.setup();
    let resolveGeneration: ((value: { pdf_path: string; pdf_url: string; generated_at: string; filename: string }) => void) | null = null;

    apiMocks.generateBriefingPdf.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGeneration = resolve;
        })
    );

    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: /^pdf$/i }));
    expect(screen.getByRole("button", { name: /chargement/i })).toBeDisabled();

    resolveGeneration?.({
      pdf_path: "u1/b1/briefing.pdf",
      pdf_url: "https://example.test/briefing.pdf",
      generated_at: "2026-03-07T00:00:00.000Z",
      filename: "briefing-demo-v202603070000-20260307.pdf"
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /prêt/i })).toBeInTheDocument());
  });

  it("opens share drawer and loads links for the current briefing", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: /partager/i }));
    expect(await screen.findByText(/Partager PDF/i)).toBeInTheDocument();
    expect(apiMocks.listBriefingShareLinks).toHaveBeenCalledWith(briefing.id);
  });

  it("shows subtle saved indicator after autosave", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    const titleInput = screen.getAllByPlaceholderText(/Title/i)[0];
    await user.type(titleInput, " updated");

    await waitFor(() => {
      expect(screen.getByText(/Enregistré/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("adds a page and lets the selected module move to page 2", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getAllByRole("button", { name: /Ajouter une page/i })[0]);
    const selectors = screen.getAllByRole("combobox", { name: /page-selector/i });
    await user.selectOptions(selectors[0], "1");

    expect(screen.getAllByText(/Page 2/i).length).toBeGreaterThan(0);
  });
});
