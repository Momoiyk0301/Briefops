import { createClient } from "@supabase/supabase-js";

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

export const supabase = createClient(resolveSupabaseUrl(), supabaseAnonKey);
