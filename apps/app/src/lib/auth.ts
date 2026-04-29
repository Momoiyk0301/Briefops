import { PropsWithChildren, createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";

import { captureClientError } from "@/lib/monitoring";
import { getRememberMePreference, setRememberMePreference, supabase, syncStoredSessionPersistence } from "@/lib/supabase";

const isE2eMockAuth = process.env.NEXT_PUBLIC_E2E_MOCK_AUTH === "true";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

export type AuthErrorKind =
  | "email_not_confirmed"
  | "user_not_found"
  | "invalid_credentials"
  | "unexpected";

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

function isInvalidRefreshTokenError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return /invalid refresh token|refresh token not found/i.test(message);
}

async function clearInvalidSession() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error && !isInvalidRefreshTokenError(error)) {
    throw error;
  }

  syncStoredSessionPersistence(null);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isE2eMockAuth) {
      const hasMockSession = localStorage.getItem("briefops:e2e-auth") === "1";
      if (hasMockSession) {
        setSession({ access_token: "e2e-token", token_type: "bearer", user: { id: "e2e-user", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: new Date().toISOString() } } as Session);
      } else {
        setSession(null);
      }
      setLoading(false);
      return;
    }

    void supabase.auth.getSession()
      .then(async ({ data, error }) => {
        if (error && isInvalidRefreshTokenError(error)) {
          await clearInvalidSession();
          setSession(null);
          setLoading(false);
          return;
        }
        if (error) throw error;
        setSession(data.session);
        setLoading(false);
      })
      .catch(async (error) => {
        if (isInvalidRefreshTokenError(error)) {
          await clearInvalidSession();
          setSession(null);
          setLoading(false);
          return;
        }
        captureClientError(error, { area: "auth", action: "bootstrap-session" });
        setSession(null);
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      syncStoredSessionPersistence(nextSession);
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, loading }), [session, loading]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function getSession(): Promise<Session | null> {
  if (isE2eMockAuth) {
    const hasMockSession = localStorage.getItem("briefops:e2e-auth") === "1";
    if (!hasMockSession) return null;
    return { access_token: "e2e-token", token_type: "bearer", user: { id: "e2e-user", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: new Date().toISOString() } } as Session;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    if (isInvalidRefreshTokenError(error)) {
      await clearInvalidSession();
      return null;
    }
    throw error;
  }
  return data.session;
}

function readHashSessionTokens() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) return null;
  return { access_token: accessToken, refresh_token: refreshToken };
}

export async function completeAuthRedirectSession(): Promise<Session | null> {
  if (isE2eMockAuth) {
    return getSession();
  }

  if (typeof window === "undefined") {
    return getSession();
  }

  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    syncStoredSessionPersistence(data.session ?? null);
    url.searchParams.delete("code");
    url.searchParams.delete("type");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    replaceCurrentUrl(url);
    return data.session;
  }

  const hashSession = readHashSessionTokens();
  if (hashSession) {
    const { data, error } = await supabase.auth.setSession(hashSession);
    if (error) throw error;
    syncStoredSessionPersistence(data.session ?? null);
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
    return data.session;
  }

  return getSession();
}

export async function signInWithPassword(email: string, password: string, rememberMe = getRememberMePreference()) {
  if (isE2eMockAuth) {
    localStorage.setItem("briefops:e2e-auth", "1");
    return { user: { email } };
  }
  setRememberMePreference(rememberMe);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.session) {
    const { error: setSessionError } = await supabase.auth.setSession(data.session);
    if (setSessionError) throw setSessionError;
    syncStoredSessionPersistence(data.session, rememberMe);
  }
  return data;
}

export async function signUpWithPassword(email: string, password: string, rememberMe = true) {
  if (isE2eMockAuth) {
    localStorage.setItem("briefops:e2e-auth", "1");
    return { user: { email }, session: null };
  }
  setRememberMePreference(rememberMe);
  const emailRedirectTo = buildBrowserRedirectUrl("/auth/confirmed");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo
    }
  });
  if (error) throw error;
  if (data.session) {
    const { error: setSessionError } = await supabase.auth.setSession(data.session);
    if (setSessionError) throw setSessionError;
    syncStoredSessionPersistence(data.session, rememberMe);
  }
  return data;
}

export async function resendSignupConfirmation(email: string) {
  if (isE2eMockAuth) return;
  const emailRedirectTo = buildBrowserRedirectUrl("/auth/confirmed");
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo
    }
  });
  if (error) throw error;
}

function buildBrowserRedirectUrl(path: string) {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${path}`;
}

function replaceCurrentUrl(url: URL) {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}

export type LoginErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_not_found"
  | "rate_limited"
  | "unknown";

export function classifyLoginError(error: unknown): LoginErrorKind {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/email not confirmed/i.test(message)) return "email_not_confirmed";
  if (/invalid login credentials|invalid credentials|invalid email or password/i.test(message)) return "invalid_credentials";
  if (/user not found/i.test(message)) return "user_not_found";
  if (/rate limit|too many requests/i.test(message)) return "rate_limited";
  return "unknown";
}

export async function resetPasswordForEmail(email: string) {
  if (isE2eMockAuth) return;
  const redirectTo = buildBrowserRedirectUrl("/auth/reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (isE2eMockAuth) return;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export function getAuthErrorKind(error: unknown): AuthErrorKind {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  if (/email not confirmed|email_not_confirmed/.test(normalized)) {
    return "email_not_confirmed";
  }

  if (/user not found|account does not exist|no user found/.test(normalized)) {
    return "user_not_found";
  }

  if (/invalid login credentials|invalid credentials|wrong password|invalid password/.test(normalized)) {
    return "invalid_credentials";
  }

  return "unexpected";
}

export function getAuthErrorMessage(error: unknown) {
  const kind = getAuthErrorKind(error);

  if (kind === "email_not_confirmed") {
    return "Ton email n’est pas encore confirmé.";
  }

  if (kind === "user_not_found") {
    return "Aucun compte n’a été trouvé avec cette adresse email.";
  }

  if (kind === "invalid_credentials") {
    return "Email ou mot de passe incorrect.";
  }

  return error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
}

export { getRememberMePreference };

export async function revalidateCurrentSession() {
  try {
    const session = await completeAuthRedirectSession();
    if (session) return session;

    const { data, error } = await supabase.auth.refreshSession();
    if (error && !isInvalidRefreshTokenError(error)) throw error;
    if (data.session) {
      syncStoredSessionPersistence(data.session);
    }
    return data.session ?? null;
  } catch (error) {
    captureClientError(error, { area: "auth", action: "revalidate-session" });
    throw error;
  }
}

export function hasAuthCallbackParams() {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  if (url.searchParams.has("code")) return true;
  if (url.searchParams.get("type") === "recovery") return true;

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) return false;

  const hashParams = new URLSearchParams(hash);
  return Boolean(hashParams.get("access_token") || hashParams.get("refresh_token") || hashParams.get("type") === "recovery");
}

export function getAuthRedirectErrorMessage() {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const searchError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (searchError) return searchError;

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) return null;

  const hashParams = new URLSearchParams(hash);
  return hashParams.get("error_description") ?? hashParams.get("error");
}

export async function signOut() {
  if (isE2eMockAuth) {
    localStorage.removeItem("briefops:e2e-auth");
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error && !isInvalidRefreshTokenError(error)) throw error;
  syncStoredSessionPersistence(null);
}
