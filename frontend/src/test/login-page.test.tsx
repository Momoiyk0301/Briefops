import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import i18n from "@/i18n";
import LoginPage from "@/views/LoginPage";

const { signInWithPassword, signUpWithPassword } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  signInWithPassword,
  signUpWithPassword
}));

vi.mock("@/lib/api", () => ({
  getMe: vi.fn().mockResolvedValue({ org: null })
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

function renderPage() {
  const client = new QueryClient();
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <LoginPage />
        </QueryClientProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  it("submits login form", async () => {
    signInWithPassword.mockResolvedValueOnce({});
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password|mot de passe/i), "secret12");
    const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    expect(submitButton).not.toBeNull();
    if (submitButton) {
      await userEvent.click(submitButton);
    }

    expect(signInWithPassword).toHaveBeenCalled();
  });
});
