import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import BriefingsPage from "@/views/BriefingsPage";

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn().mockResolvedValue({ org: { id: "org-1", name: "Org" } }),
  createBriefing: vi.fn(),
  listBriefingShareLinks: vi.fn().mockResolvedValue([]),
  getStaff: vi.fn().mockResolvedValue([]),
  listPublicLinks: vi.fn().mockResolvedValue([])
}));

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn()
}));

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn()
}));

vi.mock("@/lib/api", () => ({
  getMe: apiMocks.getMe,
  getBriefingsWithFallback: vi.fn().mockResolvedValue({
    demo: true,
    reason: "fetch failed",
    data: [
      {
        id: "demo-1",
        org_id: "org-1",
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
  listPublicLinks: apiMocks.listPublicLinks,
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
    useNavigate: () => routerMocks.navigate
  };
});

vi.mock("react-hot-toast", () => ({
  default: toastMocks
}));

describe("BriefingsPage", () => {
  beforeEach(() => {
    apiMocks.getMe.mockResolvedValue({ org: { id: "org-1", name: "Org" } });
    apiMocks.createBriefing.mockReset();
    apiMocks.listBriefingShareLinks.mockClear();
    routerMocks.navigate.mockReset();
    toastMocks.error.mockReset();
    toastMocks.success.mockReset();
  });

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
      expect(screen.getAllByText(/Demo - One/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Status/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Shared/i).length).toBeGreaterThan(0);
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

    await waitFor(() => expect(screen.getAllByText(/Demo - One/).length).toBeGreaterThan(0));
    await user.click(screen.getAllByLabelText(/Partager le briefing/i)[0]);

    await waitFor(() => {
      expect(screen.getByText(/Partager le briefing/i)).toBeInTheDocument();
      expect(apiMocks.listBriefingShareLinks).toHaveBeenCalledWith("demo-1");
    });
  });

  it("redirects to onboarding when workspace is missing", async () => {
    apiMocks.getMe.mockResolvedValue({ org: null, workspace: null });

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

    await waitFor(() => expect(screen.getAllByText(/Demo - One/).length).toBeGreaterThan(0));
    await user.click(screen.getAllByRole("button", { name: /Nouveau briefing/i })[0]);

    expect(routerMocks.navigate).toHaveBeenCalledWith("/onboarding");
    expect(toastMocks.error).toHaveBeenCalledWith("Workspace missing. Complete onboarding first.");
    expect(apiMocks.createBriefing).not.toHaveBeenCalled();
  });
});
