import { createClient, Session, SupportedStorage } from "@supabase/supabase-js";

const rawSupabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

if (!rawSupabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

function resolveSupabaseUrl(): string {
  if (isValidHttpUrl(rawSupabaseUrl)) {
    return rawSupabaseUrl;
  }

  // Common misconfiguration: NEXT_PUBLIC_SUPABASE_URL accidentally contains a key.
  const payload = decodeJwtPayload(supabaseAnonKey);
  const ref = typeof payload?.ref === "string" ? payload.ref : null;

  if (ref) {
    const guessed = `https://${ref}.supabase.co`;
    console.warn(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Falling back to inferred URL from anon key:",
      guessed
    );
    return guessed;
  }

  throw new Error(
    "Invalid NEXT_PUBLIC_SUPABASE_URL. Expected a valid http(s) URL like https://<project-ref>.supabase.co"
  );
}

const resolvedSupabaseUrl = resolveSupabaseUrl();
const REMEMBER_ME_KEY = "briefops:remember_me";

function getProjectRef() {
  try {
    return new URL(resolvedSupabaseUrl).hostname.split(".")[0] ?? "briefops";
  } catch {
    return "briefops";
  }
}

export const SUPABASE_AUTH_STORAGE_KEY = `sb-${getProjectRef()}-auth-token`;

function getStorageTarget() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REMEMBER_ME_KEY) === "false" ? window.sessionStorage : window.localStorage;
}

function createAuthStorage(): SupportedStorage {
  return {
    getItem(key) {
      if (typeof window === "undefined") return null;
      return getStorageTarget()?.getItem(key) ?? null;
    },
    setItem(key, value) {
      if (typeof window === "undefined") return;
      getStorageTarget()?.setItem(key, value);
    },
    removeItem(key) {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  };
}

export function getRememberMePreference() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(REMEMBER_ME_KEY) !== "false";
}

export function setRememberMePreference(rememberMe: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
}

function clearStoredSession(target: Storage) {
  target.removeItem(SUPABASE_AUTH_STORAGE_KEY);
}

function writeStoredSession(target: Storage, session: Session) {
  target.setItem(SUPABASE_AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function syncStoredSessionPersistence(session: Session | null, rememberMe = getRememberMePreference()) {
  if (typeof window === "undefined") return;

  const preferredStorage = rememberMe ? window.localStorage : window.sessionStorage;
  const otherStorage = rememberMe ? window.sessionStorage : window.localStorage;

  clearStoredSession(otherStorage);
  if (!session) {
    clearStoredSession(preferredStorage);
    return;
  }

  writeStoredSession(preferredStorage, session);
}

export const supabase = createClient(resolvedSupabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createAuthStorage(),
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
