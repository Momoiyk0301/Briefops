import { randomUUID } from "crypto";

import { SupabaseClient } from "@supabase/supabase-js";

export async function listPublicLinks(client: SupabaseClient, briefingId: string) {
  const { data, error } = await client
    .from("public_links")
    .select("id, briefing_id, token, expires_at, created_at")
    .eq("briefing_id", briefingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPublicLink(client: SupabaseClient, briefingId: string, expiresAt?: string | null) {
  const token = randomUUID().replaceAll("-", "");

  const { data, error } = await client
    .from("public_links")
    .insert({
      briefing_id: briefingId,
      token,
      expires_at: expiresAt ?? null
    })
    .select("id, briefing_id, token, expires_at, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function getBriefingByPublicToken(client: SupabaseClient, token: string) {
  const { data: link, error: linkError } = await client
    .from("public_links")
    .select("briefing_id")
    .eq("token", token)
    .single();

  if (linkError) throw linkError;

  const { data: briefing, error: briefingError } = await client
    .from("briefings")
    .select("id, org_id, title, event_date, location_text, created_at, updated_at")
    .eq("id", link.briefing_id)
    .single();

  if (briefingError) throw briefingError;

  const { data: modules, error: modulesError } = await client
    .from("briefing_modules")
    .select("id, module_key, enabled, data_json, created_at, updated_at")
    .eq("briefing_id", link.briefing_id)
    .order("created_at", { ascending: true });

  if (modulesError) throw modulesError;

  return { briefing, modules };
}
