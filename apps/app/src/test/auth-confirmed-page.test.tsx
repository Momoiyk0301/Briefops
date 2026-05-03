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

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  completeAuthRedirectSession: authMocks.completeAuthRedirectSession
}));

vi.mock("@/lib/api", () => ({
  getMe: apiMocks.getMe
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
    apiMocks.getMe.mockResolvedValue({
      user: { id: "u1", email: "test@example.com" },
      plan: "starter",
      org: { id: "ws-1", name: "Workspace" },
      workspace: { id: "ws-1", name: "Workspace" },
      has_membership: true,
      role: "owner",
      is_admin: false,
      onboarding_step: "done",
      degraded: false
    });
  });

  it("redirects after auth confirmation using the current account state", async () => {
    authMocks.completeAuthRedirectSession.mockResolvedValueOnce({ access_token: "token" });

    render(
      <MemoryRouter>
        <AuthConfirmedPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(routerMocks.navigate).toHaveBeenCalledWith("/briefings", { replace: true });
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
