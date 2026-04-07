import { randomBytes } from "crypto";

import { SupabaseClient } from "@supabase/supabase-js";

import { PublicLinkType } from "@/lib/types";

export const PUBLIC_LINK_INVALID_MESSAGE = "This link has expired. Please ask the owner for a new link.";

function computeLinkStatus(input: { expires_at: string | null; revoked_at: string | null }) {
  if (input.revoked_at) return "revoked" as const;
  if (input.expires_at && new Date(input.expires_at) <= new Date()) return "expired" as const;
  return "active" as const;
}

function normalizeAudienceTag(tag?: string | null) {
  if (!tag) return null;
  const normalized = tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || null;
}

function createToken() {
  return randomBytes(24).toString("base64url");
}

const SELECT_PUBLIC_LINK_FIELDS =
  "id, briefing_id, resource_type, link_type, audience_tag, token, created_by, expires_at, revoked_at, created_at";

function withComputedFields<T extends { audience_tag?: string | null; expires_at: string | null; revoked_at: string | null }>(link: T) {
  return {
    ...link,
    team: link.audience_tag ?? null,
    status: computeLinkStatus(link)
  };
}

export async function listPublicLinks(client: SupabaseClient, briefingId: string) {
  const { data, error } = await client
    .from("public_links")
    .select(SELECT_PUBLIC_LINK_FIELDS)
    .eq("briefing_id", briefingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((link) => withComputedFields(link));
}

export async function listPublicLinksForCreator(client: SupabaseClient, createdBy: string) {
  const { data, error } = await client
    .from("public_links")
    .select(SELECT_PUBLIC_LINK_FIELDS)
    .eq("created_by", createdBy)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((link) => withComputedFields(link));
}

export async function createPublicLink(
  client: SupabaseClient,
  briefingId: string,
  createdBy: string,
  expiresAt?: string | null,
  linkType: PublicLinkType = "staff",
  audienceTag?: string | null
) {
  const normalizedAudienceTag = normalizeAudienceTag(audienceTag);
  const token = createToken();

  const { data, error } = await client
    .from("public_links")
    .insert({
      briefing_id: briefingId,
      created_by: createdBy,
      token,
      link_type: linkType,
      audience_tag: normalizedAudienceTag,
      expires_at: expiresAt ?? null
    })
    .select(SELECT_PUBLIC_LINK_FIELDS)
    .single();

  if (error) throw error;
  return withComputedFields(data);
}

export async function revokePublicLink(client: SupabaseClient, linkId: string, createdBy: string) {
  const { data, error } = await client
    .from("public_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("created_by", createdBy)
    .is("revoked_at", null)
    .select(SELECT_PUBLIC_LINK_FIELDS)
    .maybeSingle();

  if (error) throw error;
  return data ? withComputedFields(data) : null;
}

async function getPublicBriefingPayload(client: SupabaseClient, briefingId: string) {
  const { data: briefing, error: briefingError } = await client
    .from("briefings")
    .select("id, title, status, shared, event_date, location_text, created_by, created_at, updated_at")
    .eq("id", briefingId)
    .single();

  if (briefingError) throw briefingError;

  const { data: modules, error: modulesError } = await client
    .from("briefing_modules")
    .select("id, briefing_id, module_id, module_key, enabled, data_json, created_at, updated_at")
    .eq("briefing_id", briefingId)
    .order("created_at", { ascending: true });

  if (modulesError) throw modulesError;

  return { briefing, modules };
}

async function getActivePublicLink(client: SupabaseClient, token: string) {
  const { data: link, error: linkError } = await client
    .from("public_links")
    .select(SELECT_PUBLIC_LINK_FIELDS)
    .eq("token", token)
    .maybeSingle();

  if (linkError) throw linkError;
  if (!link) return null;
  const withStatus = withComputedFields(link);
  if (withStatus.status !== "active") return null;
  return withStatus;
}

export async function resolveStaffBriefingByToken(client: SupabaseClient, token: string) {
  const link = await getActivePublicLink(client, token);
  if (!link || link.link_type !== "staff") return null;
  const payload = await getPublicBriefingPayload(client, link.briefing_id);
  return { ...payload, link, audienceTag: null as string | null, resolvedView: "staff" as const };
}

export async function resolveAudienceBriefingByToken(client: SupabaseClient, briefingId: string, tag: string, token: string) {
  const normalizedTag = normalizeAudienceTag(tag);
  const link = await getActivePublicLink(client, token);
  if (!link || link.link_type !== "audience") return null;
  if (link.briefing_id !== briefingId) return null;
  if ((link.audience_tag ?? null) !== normalizedTag) return null;
  const payload = await getPublicBriefingPayload(client, briefingId);
  return { ...payload, link, audienceTag: normalizedTag, resolvedView: "audience" as const };
}
