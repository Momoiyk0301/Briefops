import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import CheckEmailPage from "@/views/CheckEmailPage";

const authMocks = vi.hoisted(() => ({
  resendSignupConfirmation: vi.fn(),
  revalidateCurrentSession: vi.fn()
}));

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  toApiMessage: vi.fn((error: unknown) => String(error))
}));

const redirectMocks = vi.hoisted(() => ({
  getPostAuthRedirect: vi.fn(() => "/briefings")
}));

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn()
}));

vi.mock("@/lib/auth", () => authMocks);
vi.mock("@/lib/api", () => apiMocks);
vi.mock("@/lib/authRedirect", () => redirectMocks);
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate
  };
});

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}));

vi.mock("react-hot-toast", () => ({
  default: toastMocks
}));

function renderPage(initialPath = "/auth/check-email?email=ops%40briefops.app") {
  const client = new QueryClient();

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path="/auth/check-email" element={<CheckEmailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("CheckEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resends the confirmation email", async () => {
    authMocks.resendSignupConfirmation.mockResolvedValueOnce(undefined);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /Renvoyer l’email/i }));

    expect(authMocks.resendSignupConfirmation).toHaveBeenCalledWith("ops@briefops.app");
    expect(toastMocks.success).toHaveBeenCalledWith("Email envoyé");
  });

  it("redirects to the app when a confirmed session is detected", async () => {
    authMocks.revalidateCurrentSession.mockResolvedValueOnce({ access_token: "token" });
    apiMocks.getMe.mockResolvedValueOnce({ role: "owner" });
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /J’ai confirmé mon email/i }));

    await waitFor(() => {
      expect(routerMocks.navigate).toHaveBeenCalledWith("/briefings", { replace: true });
    });
  });

  it("shows guidance when no session can be revalidated", async () => {
    authMocks.revalidateCurrentSession.mockResolvedValueOnce(null);
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /J’ai confirmé mon email/i }));

    expect(await screen.findByText(/Aucune session confirmée n’a été détectée/i)).toBeInTheDocument();
  });
});
