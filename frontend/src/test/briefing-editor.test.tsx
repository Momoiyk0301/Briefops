import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { BriefingEditor } from "@/components/briefing/BriefingEditor";
import { moduleEntries, moduleRegistry } from "@/lib/moduleRegistry";
import { Briefing, BriefingModuleRow } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  generateBriefingPdf: vi.fn(),
  getStorageSignedUrl: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  generateBriefingPdf: apiMocks.generateBriefingPdf,
  getStorageSignedUrl: apiMocks.getStorageSignedUrl,
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
    let resolveGeneration: ((value: { pdf_path: string; pdf_url: string; generated_at: string }) => void) | null = null;

    apiMocks.generateBriefingPdf.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGeneration = resolve;
        })
    );

    render(<BriefingEditor briefing={briefing} modules={modules} />);

    await user.click(screen.getByRole("button", { name: /télécharger pdf|download pdf/i }));
    expect(screen.getByRole("button", { name: /chargement|loading/i })).toBeDisabled();

    resolveGeneration?.({
      pdf_path: "u1/b1/briefing.pdf",
      pdf_url: "https://example.test/briefing.pdf",
      generated_at: "2026-03-07T00:00:00.000Z"
    });

    await waitFor(() => {
      expect(screen.getByLabelText("open-generated-pdf")).toHaveAttribute("href", "https://example.test/briefing.pdf");
    });
  });
});
