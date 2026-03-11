import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPasswordMock = vi.fn();
const signUpMock = vi.fn();
const setSessionMock = vi.fn();
const getSessionMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signUp: signUpMock,
      setSession: setSessionMock,
      getSession: getSessionMock,
      signOut: signOutMock
    }
  }
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

    expect(setSessionMock).toHaveBeenCalledWith({ access_token: "token", refresh_token: "refresh" });
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
  });

  it("ignores invalid refresh token during signOut", async () => {
    signOutMock.mockResolvedValueOnce({
      error: { message: "Invalid Refresh Token: Refresh Token Not Found" }
    });

    const { signOut } = await import("@/lib/auth");
    await expect(signOut()).resolves.toBeUndefined();
  });
});
