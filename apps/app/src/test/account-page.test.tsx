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
  getProducts: vi.fn(),
  createStripeCheckoutSession: vi.fn(),
  createStripeCheckoutSessionByPrice: vi.fn(),
  createStripePortalSession: vi.fn(),
  getStorageSignedUrl: vi.fn(),
  uploadStorageFile: vi.fn(),
  updateMyAvatar: vi.fn(),
  updateWorkspaceLogo: vi.fn(),
  toApiMessage: vi.fn((error: unknown) => (error instanceof Error ? error.message : String(error)))
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}));

vi.mock("@/lib/api", () => apiMocks);
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
    window.localStorage.setItem("briefops:account_phone", "+32 123 45 67");
    apiMocks.getMe.mockResolvedValue({
      user: { id: "user-1", email: "ops@briefops.app", avatar_path: null, initials: "OP" },
      plan: "starter",
      subscription_name: "Starter",
      subscription_status: "active",
      stripe_price_id: "price_starter",
      current_period_end: "2026-04-01T00:00:00.000Z",
      usage: { pdf_exports_used: 2, pdf_exports_limit: 100, pdf_exports_remaining: 98 },
      org: { id: "org-1", name: "BriefOPS", initials: "BR", logo_path: null, briefings_count: 2, storage_used_bytes: 1024, pdf_exports_month: 2, due_at: null },
      workspace: { id: "org-1", name: "BriefOPS", initials: "BR", logo_path: null, briefings_count: 2, storage_used_bytes: 1024, pdf_exports_month: 2, due_at: null },
      role: "owner",
      is_admin: true,
      degraded: false
    });
    apiMocks.getProducts.mockResolvedValue([]);
  });

  it("shows the phone number as read-only profile information by default", async () => {
    renderPage();

    expect(await screen.findByText("+32 123 45 67")).toBeInTheDocument();
    expect(screen.queryByLabelText("profile-phone-input")).not.toBeInTheDocument();
  });

  it("toggles edit mode with save and cancel behavior", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "edit-profile" }));
    const input = screen.getByLabelText("profile-phone-input");
    await user.clear(input);
    await user.type(input, "+32 999 00 00");
    await user.click(screen.getByRole("button", { name: /Save/i }));

    expect(window.localStorage.getItem("briefops:account_phone")).toBe("+32 999 00 00");
    expect(toast.success).toHaveBeenCalledWith("Profil mis a jour");

    await user.click(screen.getByRole("button", { name: "edit-profile" }));
    const cancelInput = screen.getByLabelText("profile-phone-input");
    await user.clear(cancelInput);
    await user.type(cancelInput, "temp");
    await user.click(screen.getAllByRole("button", { name: /Cancel/i })[1]);

    expect(screen.getByText("+32 999 00 00")).toBeInTheDocument();
  });

  it("shows billing return feedback from Stripe portal", async () => {
    renderPage("/account?billing=returned");
    expect(await screen.findByText(/Retour du portail de facturation/i)).toBeInTheDocument();
  });

  it("shows a toast when portal cannot open because stripe customer is missing", async () => {
    apiMocks.createStripePortalSession.mockRejectedValueOnce(new Error("Aucune facturation Stripe active pour ce compte. Choisis une offre pour commencer."));
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: /Gerer la facturation/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Aucune facturation active pour ce compte. Choisis une offre pour activer Stripe.");
    });
  });

  it("shows enterprise CTA and supports avatar/logo uploads", async () => {
    apiMocks.getProducts.mockResolvedValue([
      {
        id: "p-enterprise",
        name: "Enterprise",
        slug: "enterprise",
        description: "Custom",
        stripe_price_id: null,
        price_amount: null,
        price_currency: null,
        billing_interval: null,
        features: ["Custom modules"],
        is_highlighted: false,
        sort_order: 3
      }
    ]);
    apiMocks.uploadStorageFile.mockResolvedValue({ bucket: "avatars", path: "user/u1/avatar.png" });
    apiMocks.updateMyAvatar.mockResolvedValue({ data: { id: "user-1", avatar_path: "user/u1/avatar.png" } });
    apiMocks.updateWorkspaceLogo.mockResolvedValue({ data: { id: "org-1", logo_path: "workspace/org-1/logo.png" } });

    renderPage();
    const user = userEvent.setup();

    await user.upload(await screen.findByLabelText("upload-avatar"), new File(["avatar"], "avatar.png", { type: "image/png" }));
    expect(apiMocks.uploadStorageFile).toHaveBeenCalled();
    expect(apiMocks.updateMyAvatar).toHaveBeenCalledWith("user/u1/avatar.png");

    apiMocks.uploadStorageFile.mockResolvedValueOnce({ bucket: "logos", path: "workspace/org-1/logo.png" });
    await user.upload(screen.getByLabelText("upload-logo"), new File(["logo"], "logo.png", { type: "image/png" }));
    expect(apiMocks.updateWorkspaceLogo).toHaveBeenCalledWith("workspace/org-1/logo.png");

    expect(await screen.findByRole("button", { name: /Contact us/i })).toBeInTheDocument();
  });
});
