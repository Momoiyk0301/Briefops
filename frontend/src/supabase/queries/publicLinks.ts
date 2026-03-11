import { randomBytes } from "crypto";

import { SupabaseClient } from "@supabase/supabase-js";

export const PUBLIC_LINK_INVALID_MESSAGE = "This link has expired. Please ask the owner for a new link.";
const TEAM_TOKEN_PREFIX = "tm_";

function computeLinkStatus(input: { expires_at: string | null; revoked_at: string | null }) {
  if (input.revoked_at) return "revoked" as const;
  if (input.expires_at && new Date(input.expires_at) <= new Date()) return "expired" as const;
  return "active" as const;
}

function normalizeTeamKey(team?: string | null) {
  if (!team) return null;
  const normalized = team
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || null;
}

function extractTeamFromToken(token: string) {
  if (!token.startsWith(TEAM_TOKEN_PREFIX)) return null;
  const separator = token.lastIndexOf("_");
  if (separator <= TEAM_TOKEN_PREFIX.length) return null;
  const team = token.slice(TEAM_TOKEN_PREFIX.length, separator);
  return team || null;
}

function createToken(team?: string | null) {
  const normalizedTeam = normalizeTeamKey(team);
  const secureToken = randomBytes(24).toString("base64url");
  if (!normalizedTeam) return secureToken;
  return `${TEAM_TOKEN_PREFIX}${normalizedTeam}_${secureToken}`;
}

export async function listPublicLinks(client: SupabaseClient, briefingId: string) {
  const { data, error } = await client
    .from("public_links")
    .select("id, briefing_id, token, created_by, expires_at, revoked_at, created_at")
    .eq("briefing_id", briefingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((link) => ({
    resource_type: "pdf",
    team: extractTeamFromToken(link.token),
    ...link,
    status: computeLinkStatus(link)
  }));
}

export async function listPublicLinksForCreator(client: SupabaseClient, createdBy: string) {
  const { data, error } = await client
    .from("public_links")
    .select("id, briefing_id, token, created_by, expires_at, revoked_at, created_at")
    .eq("created_by", createdBy)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((link) => ({
    resource_type: "pdf",
    team: extractTeamFromToken(link.token),
    ...link,
    status: computeLinkStatus(link)
  }));
}

export async function createPublicLink(
  client: SupabaseClient,
  briefingId: string,
  createdBy: string,
  expiresAt?: string | null,
  team?: string | null
) {
  const token = createToken(team);

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
  return {
    resource_type: "pdf",
    team: extractTeamFromToken(data.token),
    ...data,
    status: computeLinkStatus(data)
  };
}

export async function revokePublicLink(
  client: SupabaseClient,
  linkId: string,
  createdBy: string
) {
  const { data, error } = await client
    .from("public_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("created_by", createdBy)
    .is("revoked_at", null)
    .select("id, briefing_id, token, created_by, expires_at, revoked_at, created_at")
    .maybeSingle();

  if (error) throw error;
  return data
    ? {
        resource_type: "pdf",
        team: extractTeamFromToken(data.token),
        ...data,
        status: computeLinkStatus(data)
      }
    : null;
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
    .select("id, workspace_id, title, event_date, location_text, created_at, updated_at")
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

  const status = computeLinkStatus(link);
  if (status !== "active") return null;

  const team = extractTeamFromToken(link.token);
  const { data: briefing, error: briefingError } = await client
    .from("briefings")
    .select("id, created_by, pdf_path")
    .eq("id", link.briefing_id)
    .maybeSingle();
  if (briefingError) throw briefingError;
  if (!briefing) return null;

  const resolvedPdfPath = team ? `${briefing.created_by}/${link.briefing_id}/team-${team}.pdf` : briefing.pdf_path ?? null;
  if (!resolvedPdfPath) return null;

  return {
    linkId: link.id,
    briefingId: briefing.id,
    team,
    pdfPath: resolvedPdfPath,
    expiresAt: link.expires_at
  };
}
