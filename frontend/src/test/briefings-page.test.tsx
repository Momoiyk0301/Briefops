import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import BriefingsPage from "@/views/BriefingsPage";

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn().mockResolvedValue({ org: { id: "org-1", name: "Org" }, workspace: { id: "org-1", name: "Org" } }),
  createBriefing: vi.fn().mockResolvedValue({ id: "created-1" }),
  getStaff: vi.fn().mockResolvedValue([]),
  listBriefingShareLinks: vi.fn().mockResolvedValue([]),
  toApiMessage: vi.fn((e: unknown) => String(e))
}));

const routerMocks = vi.hoisted(() => ({ navigate: vi.fn() }));
const toastMocks = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock("@/lib/api", () => ({
  getMe: apiMocks.getMe,
  getBriefingsWithFallback: vi.fn().mockResolvedValue({
    demo: true,
    reason: "fetch failed",
    data: [
      {
        id: "demo-1",
        workspace_id: "org-1",
        title: "Demo - One",
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
  createBriefing: apiMocks.createBriefing,
  deleteBriefing: vi.fn(),
  getStaff: apiMocks.getStaff,
  listBriefingShareLinks: apiMocks.listBriefingShareLinks,
  createBriefingShareLink: vi.fn(),
  revokeBriefingShareLink: vi.fn(),
  upsertBriefingModules: vi.fn(),
  toApiMessage: apiMocks.toApiMessage
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => routerMocks.navigate };
});

vi.mock("react-hot-toast", () => ({ default: toastMocks }));

describe("BriefingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    const client = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <BriefingsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  it("shows demo data badge and row actions", async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText(/Demo data/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Partager le briefing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Supprimer le briefing/i })).toBeInTheDocument();
  });

  it("routes to the briefing preview when clicking on a row", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText(/Demo - One/i));
    expect(routerMocks.navigate).toHaveBeenCalledWith("/briefings/demo-1");
  });

  it("opens the share panel from row actions without triggering row navigation", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /Partager le briefing/i }));

    await waitFor(() => {
      expect(screen.getByText(/Share briefing/i)).toBeInTheDocument();
      expect(apiMocks.listBriefingShareLinks).toHaveBeenCalledWith("demo-1");
    });
    expect(routerMocks.navigate).not.toHaveBeenCalledWith("/briefings/demo-1");
  });

  it("creates a briefing with workspace_id from the current workspace", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /briefings\.new/i }));

    await waitFor(() => {
      expect(apiMocks.createBriefing).toHaveBeenCalledWith({
        workspace_id: "org-1",
        title: "Untitled briefing"
      });
    });
    expect(routerMocks.navigate).toHaveBeenCalledWith("/briefings/created-1", {
      state: { initializingNewBriefing: true }
    });
  });
});
