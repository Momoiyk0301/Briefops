import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import toast from "react-hot-toast";

import i18n from "@/i18n";
import AccountPage from "@/views/AccountPage";

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  createStripeCheckoutSession: vi.fn(),
  createStripePortalSession: vi.fn(),
  toApiMessage: vi.fn((error: unknown) => (error instanceof Error ? error.message : String(error)))
}));

vi.mock("@/lib/api", () => apiMocks);
vi.mock("@/lib/auth", () => ({
  updatePassword: vi.fn()
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}));

vi.mock("react-hot-toast", () => ({
  default: toastMocks
}));

function renderPage(initialPath = "/account") {
  const client = new QueryClient();

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <Routes>
            <Route element={<AccountPage />} path="/account" />
          </Routes>
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getMe.mockResolvedValue({
      user: { id: "user-1", email: "ops@briefops.app" },
      plan: "starter",
      subscription_name: "Starter",
      subscription_status: "active",
      stripe_price_id: "price_starter",
      current_period_end: "2026-04-01T00:00:00.000Z",
      usage: { pdf_exports_used: 2, pdf_exports_limit: 100, pdf_exports_remaining: 98 },
      org: { id: "org-1", name: "BriefOPS" },
      workspace: { id: "org-1", name: "BriefOPS" },
      role: "owner",
      is_admin: true,
      degraded: false
    });
  });

  it("shows billing return feedback from Stripe portal", async () => {
    renderPage("/account?billing=returned");

    expect(await screen.findByText(/Retour du portail de facturation/i)).toBeInTheDocument();
  });

  it("shows a toast when portal cannot open because stripe customer is missing", async () => {
    apiMocks.createStripePortalSession.mockRejectedValueOnce(new Error("Aucune facturation Stripe active pour ce compte. Choisis une offre pour commencer."));
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: /Gérer la facturation/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Aucune facturation active pour ce compte. Choisis une offre pour activer Stripe.");
    });
  });
});
