import { PropsWithChildren, createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const isE2eMockAuth = process.env.NEXT_PUBLIC_E2E_MOCK_AUTH === "true";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

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
        setSession(null);
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    return data.session;
  }

  const hashSession = readHashSessionTokens();
  if (hashSession) {
    const { data, error } = await supabase.auth.setSession(hashSession);
    if (error) throw error;
    return data.session;
  }

  return getSession();
}

export async function signInWithPassword(email: string, password: string) {
  if (isE2eMockAuth) {
    localStorage.setItem("briefops:e2e-auth", "1");
    return { user: { email } };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.session) {
    const { error: setSessionError } = await supabase.auth.setSession(data.session);
    if (setSessionError) throw setSessionError;
  }
  return data;
}

export async function signUpWithPassword(email: string, password: string) {
  if (isE2eMockAuth) {
    localStorage.setItem("briefops:e2e-auth", "1");
    return { user: { email }, session: null };
  }
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/confirmed` : undefined;
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
  }
  return data;
}

export async function resendSignupConfirmation(email: string) {
  if (isE2eMockAuth) return;
  const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/confirmed` : undefined;
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo
    }
  });
  if (error) throw error;
}

export async function resetPasswordForEmail(email: string) {
  if (isE2eMockAuth) return;
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (isE2eMockAuth) return;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  if (isE2eMockAuth) {
    localStorage.removeItem("briefops:e2e-auth");
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error && !isInvalidRefreshTokenError(error)) throw error;
}
