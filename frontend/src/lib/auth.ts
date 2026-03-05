import { PropsWithChildren, createContext, createElement, useContext, useEffect, useMemo, useState } from "react";
import { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const isE2eMockAuth = process.env.NEXT_PUBLIC_E2E_MOCK_AUTH === "true";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, loading: true });

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

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
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
  if (error) throw error;
  return data.session;
}

export async function signInWithPassword(email: string, password: string) {
  if (isE2eMockAuth) {
    localStorage.setItem("briefops:e2e-auth", "1");
    return { user: { email } };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword(email: string, password: string) {
  if (isE2eMockAuth) {
    localStorage.setItem("briefops:e2e-auth", "1");
    return { user: { email } };
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (isE2eMockAuth) {
    localStorage.removeItem("briefops:e2e-auth");
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
