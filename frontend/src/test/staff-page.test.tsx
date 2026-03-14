import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import StaffPage from "@/views/StaffPage";

const apiMocks = vi.hoisted(() => ({
  getStaff: vi.fn().mockResolvedValue([
    {
      id: "s1",
      workspace_id: "org-1",
      briefing_id: "b1",
      full_name: "Alex Martin",
      role: "Audio",
      phone: "123",
      email: "alex@briefops.app",
      notes: null,
      created_at: "now",
      updated_at: "now"
    }
  ]),
  getBriefingsWithFallback: vi.fn().mockResolvedValue({
    demo: false,
    data: [
      {
        id: "b1",
        workspace_id: "org-1",
        title: "Concert Zenith",
        status: "ready",
        shared: false,
        event_date: null,
        location_text: null,
        created_by: "u1",
        created_at: "now",
        updated_at: "now"
      },
      {
        id: "b2",
        workspace_id: "org-1",
        title: "Arena Setup",
        status: "draft",
        shared: false,
        event_date: null,
        location_text: null,
        created_by: "u1",
        created_at: "now",
        updated_at: "now"
      }
    ]
  }),
  createStaffMember: vi.fn().mockResolvedValue({}),
  toApiMessage: vi.fn((e: unknown) => String(e))
}));

vi.mock("@/lib/api", () => apiMocks);

describe("StaffPage", () => {
  function renderPage() {
    const client = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <StaffPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  it("renders the simplified toolbar and assigned briefings column", async () => {
    renderPage();

    expect(screen.getByPlaceholderText(/Rechercher un nom/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ajouter un membre/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Briefings assignés/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Concert Zenith/i).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /Ajouter un briefing/i }).length).toBeGreaterThan(0);
    });
  });

  it("opens a compact multi-select assignment UI", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click((await screen.findAllByRole("button", { name: /Ajouter un briefing/i }))[0]);

    expect(screen.getByPlaceholderText(/Rechercher un briefing/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Arena Setup/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Concert Zenith/i).length).toBeGreaterThan(0);
  });

  it("assigns multiple briefings to a staff member", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click((await screen.findAllByRole("button", { name: /Ajouter un briefing/i }))[0]);
    await user.click(screen.getByRole("checkbox", { name: /Arena Setup/i }));
    await user.click(screen.getByRole("button", { name: /Confirmer/i }));

    await waitFor(() => {
      expect(apiMocks.createStaffMember).toHaveBeenCalledWith(expect.objectContaining({ briefing_id: "b2", full_name: "Alex Martin" }));
    });
  });
});
