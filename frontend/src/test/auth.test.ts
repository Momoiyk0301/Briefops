import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPasswordMock = vi.fn();
const signUpMock = vi.fn();
const setSessionMock = vi.fn();
const getSessionMock = vi.fn();
const signOutMock = vi.fn();
const resetPasswordForEmailMock = vi.fn();
const refreshSessionMock = vi.fn();
const setRememberMePreferenceMock = vi.fn();
const getRememberMePreferenceMock = vi.fn(() => true);
const syncStoredSessionPersistenceMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
      setSession: setSessionMock,
      getSession: getSessionMock,
      refreshSession: refreshSessionMock,
      signOut: signOutMock,
      resetPasswordForEmail: resetPasswordForEmailMock
    }
  },
  getRememberMePreference: getRememberMePreferenceMock,
  setRememberMePreference: setRememberMePreferenceMock,
  syncStoredSessionPersistence: syncStoredSessionPersistenceMock
}));

describe("auth helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_E2E_MOCK_AUTH = "false";
  });

  it("persists returned session after password login", async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: {
        session: { access_token: "token", refresh_token: "refresh" }
      },
      error: null
    });
    setSessionMock.mockResolvedValueOnce({ error: null });

    const { signInWithPassword } = await import("@/lib/auth");
    await signInWithPassword("test@example.com", "secret12");

    expect(setRememberMePreferenceMock).toHaveBeenCalledWith(true);
    expect(setSessionMock).toHaveBeenCalledWith({ access_token: "token", refresh_token: "refresh" });
    expect(syncStoredSessionPersistenceMock).toHaveBeenCalledWith({ access_token: "token", refresh_token: "refresh" }, true);
  });

  it("persists returned session after signup when Supabase signs in immediately", async () => {
    signUpMock.mockResolvedValueOnce({
      data: {
        session: { access_token: "token", refresh_token: "refresh" }
      },
      error: null
    });
    setSessionMock.mockResolvedValueOnce({ error: null });

    const { signUpWithPassword } = await import("@/lib/auth");
    await signUpWithPassword("new@example.com", "secret12");

    expect(setSessionMock).toHaveBeenCalledWith({ access_token: "token", refresh_token: "refresh" });
    expect(syncStoredSessionPersistenceMock).toHaveBeenCalledWith({ access_token: "token", refresh_token: "refresh" }, true);
  });

  it("returns null and clears local auth when refresh token is invalid", async () => {
    getSessionMock.mockResolvedValueOnce({
      data: { session: null },
      error: { message: "Invalid Refresh Token: Refresh Token Not Found" }
    });
    signOutMock.mockResolvedValueOnce({ error: null });

    const { getSession } = await import("@/lib/auth");
    const session = await getSession();

    expect(session).toBeNull();
    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    expect(syncStoredSessionPersistenceMock).toHaveBeenCalledWith(null);
  });

  it("ignores invalid refresh token during signOut", async () => {
    signOutMock.mockResolvedValueOnce({
      error: { message: "Invalid Refresh Token: Refresh Token Not Found" }
    });

    const { signOut } = await import("@/lib/auth");
    await expect(signOut()).resolves.toBeUndefined();
    expect(syncStoredSessionPersistenceMock).toHaveBeenCalledWith(null);
  });

  it("uses the reset password route as redirect target", async () => {
    resetPasswordForEmailMock.mockResolvedValueOnce({ error: null });
    window.history.replaceState({}, "", "/login");

    const { resetPasswordForEmail } = await import("@/lib/auth");
    await resetPasswordForEmail("ops@briefops.app");

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("ops@briefops.app", {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
  });

  it("classifies unconfirmed email errors distinctly", async () => {
    const { getAuthErrorKind, getAuthErrorMessage } = await import("@/lib/auth");

    expect(getAuthErrorKind(new Error("Email not confirmed"))).toBe("email_not_confirmed");
    expect(getAuthErrorMessage(new Error("Email not confirmed"))).toBe("Ton email n’est pas encore confirmé.");
  });
});
