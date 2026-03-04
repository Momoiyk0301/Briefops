import { randomUUID } from "crypto";

import { SupabaseClient } from "@supabase/supabase-js";

export async function listPublicLinks(client: SupabaseClient, briefingId: string) {
  const { data, error } = await client
    .from("public_links")
    .select("id, briefing_id, token, created_by, expires_at, revoked_at, created_at")
    .eq("briefing_id", briefingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPublicLink(
  client: SupabaseClient,
  briefingId: string,
  createdBy: string,
  expiresAt?: string | null
) {
  const token = randomUUID();

  const { data, error } = await client
    .from("public_links")
    .insert({
      briefing_id: briefingId,
      created_by: createdBy,
      token,
      expires_at: expiresAt ?? null
    })
    .select("id, briefing_id, token, created_by, expires_at, revoked_at, created_at")
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

export async function getActivePublicLinkWithPdfPath(client: SupabaseClient, token: string) {
  const { data: link, error: linkError } = await client
    .from("public_links")
    .select("id, briefing_id, token, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();
  if (linkError) throw linkError;
  if (!link) return null;

  const now = new Date();
  if (link.revoked_at) return null;
  if (link.expires_at && new Date(link.expires_at) <= now) return null;

  const { data: briefing, error: briefingError } = await client
    .from("briefings")
    .select("id, pdf_path")
    .eq("id", link.briefing_id)
    .maybeSingle();
  if (briefingError) throw briefingError;
  if (!briefing?.pdf_path) return null;

  return {
    linkId: link.id,
    briefingId: briefing.id,
    pdfPath: briefing.pdf_path
  };
}
