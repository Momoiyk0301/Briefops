import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import OnboardingPage from "@/views/OnboardingPage";

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  getProducts: vi.fn(),
  postOnboarding: vi.fn(),
  updateOnboardingStep: vi.fn(),
  activateOnboardingPlan: vi.fn(),
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

  it("activates starter directly without Stripe during onboarding", async () => {
    authMocks.useAuth.mockReturnValue({
      session: { access_token: "token" },
      loading: false
    });
    apiMocks.getMe.mockResolvedValue({
      user: { id: "u1", email: "u1@test.com" },
      plan: null,
      org: { id: "ws-1", name: "Team OPS" },
      workspace: { id: "ws-1", name: "Team OPS" },
      has_membership: true,
      onboarding_step: "products",
      role: "owner",
      is_admin: false,
      degraded: false
    });
    apiMocks.getProducts.mockResolvedValue([
      {
        id: "p1",
        name: "Starter",
        slug: "starter",
        description: "Starter plan",
        stripe_price_id: null,
        price_amount: 1900,
        price_currency: "eur",
        billing_interval: "month",
        features: ["Feature 1"],
        is_highlighted: true,
        sort_order: 1
      }
    ]);
    apiMocks.updateOnboardingStep.mockResolvedValue({ ok: true, onboarding_step: "products" });
    apiMocks.activateOnboardingPlan.mockResolvedValue({ ok: true, plan: "starter", onboarding_step: "demo" });

    renderPage();

    const user = userEvent.setup();
    await waitFor(() => {
      expect(apiMocks.getProducts).toHaveBeenCalled();
    });

    await user.click(await screen.findByRole("button", { name: "S'abonner" }));

    await waitFor(() => {
      expect(apiMocks.activateOnboardingPlan).toHaveBeenCalledWith("starter");
    });

    expect(apiMocks.createOnboardingCheckoutSession).not.toHaveBeenCalled();
    expect(routerMocks.navigate).toHaveBeenCalledWith("/onboarding?step=demo");
  });

  it("redirects enterprise selection to help flow", async () => {
    apiMocks.getMe.mockResolvedValue({
      user: { id: "u1", email: "u1@test.com" },
      plan: null,
      org: { id: "ws-1", name: "Team OPS" },
      workspace: { id: "ws-1", name: "Team OPS" },
      has_membership: true,
      onboarding_step: "products",
      role: "owner",
      is_admin: false,
      degraded: false
    });
    apiMocks.getProducts.mockResolvedValue([
      {
        id: "p2",
        name: "Enterprise",
        slug: "enterprise",
        description: "Enterprise plan",
        stripe_price_id: null,
        price_amount: null,
        price_currency: null,
        billing_interval: null,
        features: ["Custom modules"],
        is_highlighted: false,
        sort_order: 2
      }
    ]);
    apiMocks.updateOnboardingStep.mockResolvedValue({ ok: true, onboarding_step: "products" });

    renderPage();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(apiMocks.getProducts).toHaveBeenCalled();
    });

    await user.click(await screen.findByRole("button", { name: /Nous contacter/i }));
    expect(routerMocks.navigate).toHaveBeenCalledWith("/help?subject=enterprise");
  });
});
