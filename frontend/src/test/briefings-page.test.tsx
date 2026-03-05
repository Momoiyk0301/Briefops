import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import BriefingsPage from "@/views/BriefingsPage";

vi.mock("@/lib/api", () => ({
  getMe: vi.fn().mockResolvedValue({ org: { id: "org-1", name: "Org" } }),
  getBriefingsWithFallback: vi.fn().mockResolvedValue({
    demo: true,
    reason: "fetch failed",
    data: [
      {
        id: "demo-1",
        org_id: "org-1",
        title: "Demo - One",
        event_date: null,
        location_text: null,
        created_by: "u1",
        created_at: "now",
        updated_at: "now"
      }
    ]
  }),
  createBriefing: vi.fn(),
  upsertBriefingModules: vi.fn(),
  toApiMessage: vi.fn((e: unknown) => String(e))
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe("BriefingsPage", () => {
  it("shows demo data badge when fallback is used", async () => {
    const client = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <BriefingsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Demo data/i)).toBeInTheDocument();
      expect(screen.getByText(/Demo - One/)).toBeInTheDocument();
    });
  });
});
