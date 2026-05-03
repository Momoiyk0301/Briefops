import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";

import { BriefingEditor } from "@/components/briefing/BriefingEditor";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  generateBriefingPdf: vi.fn(),
  getStorageSignedUrl: vi.fn(),
  listBriefingShareLinks: vi.fn().mockResolvedValue([]),
  createBriefingShareLink: vi.fn(),
  revokeBriefingShareLink: vi.fn(),
  patchBriefing: vi.fn().mockResolvedValue({})
}));

vi.mock("@/lib/api", () => ({
  generateBriefingPdf: apiMocks.generateBriefingPdf,
  getStorageSignedUrl: apiMocks.getStorageSignedUrl,
  listBriefingShareLinks: apiMocks.listBriefingShareLinks,
  createBriefingShareLink: apiMocks.createBriefingShareLink,
  revokeBriefingShareLink: apiMocks.revokeBriefingShareLink,
  patchBriefing: apiMocks.patchBriefing,
  toApiMessage: vi.fn((e: unknown) => String(e)),
  upsertBriefingModules: vi.fn().mockResolvedValue([])
}));

describe("BriefingEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.listBriefingShareLinks.mockResolvedValue([]);
    apiMocks.patchBriefing.mockResolvedValue({});
  });

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

  it("renders enabled module forms and sidebar controls", () => {
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    expect(screen.getAllByPlaceholderText(/Adresse|Address/i).length).toBeGreaterThan(0);
    expect(screen.getAllByPlaceholderText(/^Notes$/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /^Notes$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Valider|Validate/i })).toBeInTheDocument();
  });

  it("shows editor header actions", () => {
    render(<BriefingEditor briefing={briefing} modules={modules} />);
    expect(screen.getByRole("button", { name: /Valider|Validate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exporter PDF|Export PDF|editor\.pdf|^pdf$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /partager|share/i })).toBeInTheDocument();
  });

  it("can disable an optional module from the modules sidebar", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    expect(screen.getAllByPlaceholderText(/^Notes$/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: /^Notes$/i }));

    expect(screen.queryByPlaceholderText(/^Notes$/i)).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: /Exporter PDF|Export PDF|editor\.pdf|^pdf$/i }));
    expect(screen.getByRole("button", { name: /Chargement|Loading|editor\.loadingShort/i })).toBeDisabled();

    resolveGeneration?.({
      pdf_path: "u1/b1/briefing.pdf",
      pdf_url: "https://example.test/briefing.pdf",
      generated_at: "2026-03-07T00:00:00.000Z",
      filename: "briefing-demo-v202603070000-20260307.pdf"
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Télécharger|Download ready|editor\.downloadReady/i })
      ).toBeInTheDocument();
    });
  });

  it("opens share drawer and loads links for the current briefing", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: /editor\.share|partager|share/i }));
    expect(await screen.findByText(/Share briefing|Partager le briefing|Partager PDF/i)).toBeInTheDocument();
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

  it("validates the briefing after confirmation", async () => {
    const user = userEvent.setup();
    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: /Valider|Validate/i }));
    await user.click(screen.getByRole("button", { name: /Confirmer|Confirm/i }));

    await waitFor(() => {
      expect(apiMocks.patchBriefing).toHaveBeenCalledWith(briefing.id, { status: "validated" });
    }, { timeout: 3000 });
  });
});
