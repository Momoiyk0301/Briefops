import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { clientEnv, serverEnv } from "@/env";

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export function createSupabaseServerClient(accessToken?: string): SupabaseClient {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return createClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers }
  });
}

export function createServiceRoleClient(): SupabaseClient {
  return createClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function createPublicTokenClient(token: string): SupabaseClient {
  return createClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      headers: {
        "x-briefing-token": token
      }
    }
  });
}

export async function requireUser(request: Request): Promise<{ client: SupabaseClient; userId: string }> {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error("Unauthorized");
  }

  const client = createSupabaseServerClient(token);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return { client, userId: data.user.id };
}

export async function requireAuthContext(request: Request): Promise<{
  client: SupabaseClient;
  userId: string;
  email: string | null;
}> {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error("Unauthorized");
  }

  const client = createSupabaseServerClient(token);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return {
    client,
    userId: data.user.id,
    email: data.user.email ?? null
  };
}
