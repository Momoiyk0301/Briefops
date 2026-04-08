import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import toast from "react-hot-toast";

import ForgotPasswordPage from "@/views/ForgotPasswordPage";

const authMocks = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  resetPasswordForEmail: authMocks.resetPasswordForEmail
}));

vi.mock("@/lib/api", () => ({
  toApiMessage: vi.fn((error: unknown) => String(error))
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}));

vi.mock("react-hot-toast", () => ({
  default: toastMocks
}));

function renderPage(initialPath = "/auth/forgot-password") {
  const client = new QueryClient();

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route element={<ForgotPasswordPage />} path="/auth/forgot-password" />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefills email from search params", () => {
    renderPage("/auth/forgot-password?email=ops%40briefops.app");

    expect(screen.getByLabelText(/Adresse email/i)).toHaveValue("ops@briefops.app");
  });

  it("sends reset email and shows success feedback", async () => {
    authMocks.resetPasswordForEmail.mockResolvedValueOnce(undefined);
    renderPage();

    await userEvent.type(screen.getByLabelText(/Adresse email/i), "ops@briefops.app");
    await userEvent.click(screen.getByRole("button", { name: /Envoyer le lien/i }));

    expect(authMocks.resetPasswordForEmail).toHaveBeenCalledWith("ops@briefops.app");
    expect(toast.success).toHaveBeenCalledWith("Email de réinitialisation envoyé.");
    expect(screen.getByText(/Un email de réinitialisation a été envoyé à/i)).toBeInTheDocument();
  });

  it("shows an error toast when reset email fails", async () => {
    authMocks.resetPasswordForEmail.mockRejectedValueOnce(new Error("Rate limit"));
    renderPage();

    await userEvent.type(screen.getByLabelText(/Adresse email/i), "ops@briefops.app");
    await userEvent.click(screen.getByRole("button", { name: /Envoyer le lien/i }));

    expect(toast.error).toHaveBeenCalledWith("Error: Rate limit");
  });
});
