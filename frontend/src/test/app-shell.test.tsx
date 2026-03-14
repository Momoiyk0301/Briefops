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
vi.mock("@/lib/auth", () => ({
  signOut: vi.fn()
}));

describe("AppShell", () => {
  it("renders the Aide navigation entry", async () => {
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

    expect(await screen.findAllByText(/Aide/i)).not.toHaveLength(0);
  });
});
