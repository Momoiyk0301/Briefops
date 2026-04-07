import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import toast from "react-hot-toast";

import i18n from "@/i18n";
import LoginPage from "@/views/LoginPage";

const { signInWithPassword, signUpWithPassword, resendSignupConfirmation } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  resendSignupConfirmation: vi.fn()
}));

const apiMocks = vi.hoisted(() => ({
  getMe: vi.fn()
}));

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  signInWithPassword,
  signUpWithPassword,
  resendSignupConfirmation,
  getRememberMePreference: vi.fn(() => true),
  getAuthErrorKind: vi.fn((error: unknown) => {
    const message = String(error instanceof Error ? error.message : error);
    if (/email not confirmed/i.test(message)) return "email_not_confirmed";
    if (/user not found/i.test(message)) return "user_not_found";
    if (/invalid login credentials/i.test(message)) return "invalid_credentials";
    return "unexpected";
  }),
  getAuthErrorMessage: vi.fn((error: unknown) => {
    const message = String(error instanceof Error ? error.message : error);
    if (/email not confirmed/i.test(message)) return "Ton email n’est pas encore confirmé.";
    if (/user not found/i.test(message)) return "Aucun compte n’a été trouvé avec cette adresse email.";
    if (/invalid login credentials/i.test(message)) return "Email ou mot de passe incorrect.";
    return message;
  })
}));

vi.mock("@/lib/api", () => ({
  getMe: apiMocks.getMe,
  toApiMessage: vi.fn((error: unknown) => String(error))
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate
  };
});

const toastMocks = vi.hoisted(() => {
  const fn = vi.fn();
  return {
    toast: Object.assign(fn, {
      error: vi.fn(),
      success: vi.fn()
    })
  };
});

vi.mock("react-hot-toast", () => ({
  default: toastMocks.toast
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getMe.mockResolvedValue({
      role: "owner",
      org: { id: "org-1", name: "Org" },
      workspace: { id: "org-1", name: "Org" },
      plan: "starter",
      onboarding_step: "done"
    });
  });

  it("submits login form and redirects to briefings when membership exists", async () => {
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
    expect(routerMocks.navigate).toHaveBeenCalledWith("/briefings");
  });

  it("redirects login to onboarding when no membership exists yet", async () => {
    signInWithPassword.mockResolvedValueOnce({});
    apiMocks.getMe.mockResolvedValueOnce({ role: null, org: null });
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password|mot de passe/i), "secret12");
    await userEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    expect(routerMocks.navigate).toHaveBeenCalledWith("/onboarding");
  });

  it("redirects login to plan selection when workspace exists but subscription is not completed", async () => {
    signInWithPassword.mockResolvedValueOnce({});
    apiMocks.getMe.mockResolvedValueOnce({
      role: "owner",
      org: { id: "org-1", name: "Org" },
      workspace: { id: "org-1", name: "Org" },
      plan: null,
      onboarding_step: "products"
    });
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password|mot de passe/i), "secret12");
    await userEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    expect(routerMocks.navigate).toHaveBeenCalledWith("/onboarding?step=products");
    expect(toast).toHaveBeenCalledWith("Compte trouvé. Choisis une offre pour terminer l'activation.");
  });

  it("keeps login mode and shows a clear message when credentials are invalid", async () => {
    signInWithPassword.mockRejectedValueOnce(new Error("Invalid login credentials"));
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/email/i), "missing@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password|mot de passe/i), "secret12");
    await userEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    expect(toast.error).toHaveBeenCalledWith("Email ou mot de passe incorrect.");
    expect(screen.getByText(/Connexion refusée/i)).toBeInTheDocument();
    expect(routerMocks.navigate).not.toHaveBeenCalled();
  });

  it("does not switch to signup when email is not confirmed and offers resend", async () => {
    signInWithPassword.mockRejectedValueOnce(new Error("Email not confirmed"));
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/email/i), "pending@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password|mot de passe/i), "secret12");
    await userEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    expect(toast.error).toHaveBeenCalledWith("Ton email n’est pas encore confirmé.");
    expect(screen.getByText(/Ton email n’est pas encore confirmé/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Renvoyer l’email/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continuer/i })).not.toBeInTheDocument();
  });

  it("resends the confirmation email from the login page", async () => {
    signInWithPassword.mockRejectedValueOnce(new Error("Email not confirmed"));
    resendSignupConfirmation.mockResolvedValueOnce(undefined);
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/email/i), "pending@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password|mot de passe/i), "secret12");
    await userEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);
    await userEvent.click(screen.getByRole("button", { name: /Renvoyer l’email/i }));

    expect(resendSignupConfirmation).toHaveBeenCalledWith("pending@example.com");
    expect(toast.success).toHaveBeenCalledWith("Email envoyé");
  });

  it("links to dedicated forgot password page", async () => {
    renderPage();

    await userEvent.type(screen.getByPlaceholderText(/email/i), "reset@example.com");
    const link = screen.getByRole("link", { name: /Mot de passe oublié/i });

    expect(link).toHaveAttribute("href", "/auth/forgot-password?email=reset%40example.com");
  });

  it("redirects signup to email check when Supabase returns no session", async () => {
    signUpWithPassword.mockResolvedValueOnce({ session: null });
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /Créer un compte/i }));
    await userEvent.type(screen.getByPlaceholderText(/email/i), "new@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password|mot de passe/i), "secret12");
    await userEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    expect(signUpWithPassword).toHaveBeenCalledWith("new@example.com", "secret12", true);
    expect(routerMocks.navigate).toHaveBeenCalledWith("/auth/check-email?email=new%40example.com");
  });

  it("redirects signup to onboarding when session is returned immediately", async () => {
    signUpWithPassword.mockResolvedValueOnce({ session: { access_token: "token" } });
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: /Créer un compte/i }));
    await userEvent.type(screen.getByPlaceholderText(/email/i), "new@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password|mot de passe/i), "secret12");
    await userEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);

    expect(routerMocks.navigate).toHaveBeenCalledWith("/onboarding");
  });
});
