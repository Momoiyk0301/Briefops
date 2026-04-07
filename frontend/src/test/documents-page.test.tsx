import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import i18n from "@/i18n";
import DocumentsPage from "@/views/DocumentsPage";

const apiMocks = vi.hoisted(() => ({
  listBriefingExports: vi.fn(),
  listPublicLinks: vi.fn(),
  downloadBriefingExport: vi.fn().mockResolvedValue({ blob: new Blob(["pdf"]), filename: "main-stage-v3.pdf" }),
  toApiMessage: vi.fn((error: unknown) => (error instanceof Error ? error.message : String(error)))
}));

vi.mock("@/lib/api", () => apiMocks);

function renderPage() {
  const client = new QueryClient();

  render(
    <MemoryRouter initialEntries={["/documents"]}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <Routes>
            <Route path="/documents" element={<DocumentsPage />} />
          </Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe("DocumentsPage", () => {
  it("renders versioned pdf exports", async () => {
    apiMocks.listBriefingExports.mockResolvedValue([
      {
        id: "export-3",
        workspace_id: "org-1",
        briefing_id: "briefing-1",
        version: 3,
        file_path: "briefings/briefing-1/exports/v3.pdf",
        created_at: "2026-03-11T18:20:00.000Z",
        created_by: "u1",
        briefing_title: "Main Stage",
        briefing_event_date: "2026-03-11",
        briefing_location_text: "Brussels"
      },
      {
        id: "export-2",
        workspace_id: "org-1",
        briefing_id: "briefing-1",
        version: 2,
        file_path: "briefings/briefing-1/exports/v2.pdf",
        created_at: "2026-03-10T09:10:00.000Z",
        created_by: "u1",
        briefing_title: "Main Stage",
        briefing_event_date: "2026-03-11",
        briefing_location_text: "Brussels"
      }
    ]);
    apiMocks.listPublicLinks.mockResolvedValue([]);

    renderPage();

    expect((await screen.findAllByText("Main Stage")).length).toBe(2);
    expect(screen.getByText(/v3/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /download pdf/i })).toHaveLength(2);
  });
});
