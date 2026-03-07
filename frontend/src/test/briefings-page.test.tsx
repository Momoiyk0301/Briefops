import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import BriefingsPage from "@/views/BriefingsPage";

const apiMocks = vi.hoisted(() => ({
  listBriefingShareLinks: vi.fn().mockResolvedValue([])
}));

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
  deleteBriefing: vi.fn(),
  listBriefingShareLinks: apiMocks.listBriefingShareLinks,
  createBriefingShareLink: vi.fn(),
  revokeBriefingShareLink: vi.fn(),
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

  it("opens share panel for selected briefing", async () => {
    const client = new QueryClient();
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <BriefingsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Demo - One/)).toBeInTheDocument());
    await user.click(screen.getByLabelText(/Partager le briefing/i));

    await waitFor(() => {
      expect(screen.getByText(/Share PDF/i)).toBeInTheDocument();
      expect(apiMocks.listBriefingShareLinks).toHaveBeenCalledWith("demo-1");
    });
  });
});
