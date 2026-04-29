import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import AuthConfirmedPage from "@/views/AuthConfirmedPage";

const authMocks = vi.hoisted(() => ({
  completeAuthRedirectSession: vi.fn()
}));

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  completeAuthRedirectSession: authMocks.completeAuthRedirectSession
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate
  };
});

describe("AuthConfirmedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to onboarding when the auth redirect yields a session", async () => {
    authMocks.completeAuthRedirectSession.mockResolvedValueOnce({ access_token: "token" });

    render(
      <MemoryRouter>
        <AuthConfirmedPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(routerMocks.navigate).toHaveBeenCalledWith("/onboarding", { replace: true });
    });
  });

  it("falls back to login when no session is returned", async () => {
    authMocks.completeAuthRedirectSession.mockResolvedValueOnce(null);

    render(
      <MemoryRouter>
        <AuthConfirmedPage />
      </MemoryRouter>
    );

    await screen.findByText(/Se connecter/i);
    expect(routerMocks.navigate).not.toHaveBeenCalled();
  });
});
