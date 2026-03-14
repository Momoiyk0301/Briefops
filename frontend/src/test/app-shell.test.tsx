import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

import { AppShell } from "@/components/layout/AppShell";

const apiMocks = vi.hoisted(() => ({
  getBriefingsWithFallback: vi.fn().mockResolvedValue({ data: [], demo: false }),
  getMe: vi.fn().mockResolvedValue({
    user: { id: "u1", email: "ops@briefops.app", initials: "OP" },
    plan: "starter",
    workspace: { id: "w1", name: "Peak Events", initials: "PE", logo_path: null },
    org: { id: "w1", name: "Peak Events", initials: "PE", logo_path: null },
    role: "owner",
    is_admin: true,
    degraded: false
  }),
  getStorageSignedUrl: vi.fn()
}));

vi.mock("@/lib/api", () => apiMocks);
vi.mock("@/lib/auth", () => ({ signOut: vi.fn() }));

describe("AppShell", () => {
  it("renders notifications above settings in desktop navigation", async () => {
    const client = new QueryClient();
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <AppShell plan="starter">
            <div>content</div>
          </AppShell>
        </QueryClientProvider>
      </MemoryRouter>
    );

    const notifications = await screen.findAllByText(/Notifications/i);
    const settings = await screen.findAllByText(/Settings/i);

    expect(notifications.length).toBeGreaterThan(0);
    expect(settings.length).toBeGreaterThan(0);
    expect(notifications[0].compareDocumentPosition(settings[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
