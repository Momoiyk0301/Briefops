import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import StaffPage from "@/views/StaffPage";

vi.mock("@/lib/api", () => ({
  getStaff: vi.fn().mockResolvedValue([]),
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
      }
    ]
  }),
  createStaffMember: vi.fn(),
  toApiMessage: vi.fn((e: unknown) => String(e))
}));

describe("StaffPage", () => {
  it("renders briefings from fallback payload shape without crashing", async () => {
    const client = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <StaffPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Concert Zenith/i })).toBeInTheDocument();
    });
  });
});
