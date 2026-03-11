import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import OnboardingPage from "@/views/OnboardingPage";

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  getProducts: vi.fn(),
  postOnboarding: vi.fn(),
  updateOnboardingStep: vi.fn(),
  createOnboardingCheckoutSession: vi.fn(),
  toApiMessage: vi.fn((error: unknown) => String(error))
}));

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn()
}));

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn()
}));

vi.mock("@/lib/api", () => apiMocks);

vi.mock("@/lib/auth", () => ({
  useAuth: authMocks.useAuth
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate
  };
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <OnboardingPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({
      session: { access_token: "token" },
      loading: false
    });
    apiMocks.getMe.mockResolvedValue({
      user: { id: "u1", email: "u1@test.com" },
      plan: null,
      org: null,
      workspace: null,
      onboarding_step: "workspace",
      role: null,
      is_admin: false,
      degraded: true
    });
    apiMocks.getProducts.mockResolvedValue([]);
  });

  it("does not request products while me is degraded and workspace is missing", async () => {
    renderPage();

    await waitFor(() => {
      expect(apiMocks.getMe).toHaveBeenCalled();
    });

    expect(apiMocks.getProducts).not.toHaveBeenCalled();
  });
});
