import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const createBriefingSchema = z.object({
  org_id: z.string().uuid(),
  title: z.string().min(1),
  status: z.enum(["draft", "ready", "archived"]).optional(),
  event_date: z.string().date().optional(),
  location_text: z.string().optional()
});

const updateBriefingSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["draft", "ready", "archived"]).optional(),
  event_date: z.string().date().nullable().optional(),
  location_text: z.string().nullable().optional()
});

export type CreateBriefingInput = z.infer<typeof createBriefingSchema>;
export type UpdateBriefingInput = z.infer<typeof updateBriefingSchema>;

const SELECT_BRIEFING_FIELDS =
  "id, org_id, title, status, shared, event_date, location_text, pdf_path, created_by, created_at, updated_at";

export async function listBriefings(client: SupabaseClient) {
  const { data, error } = await client
    .from("briefings")
    .select(SELECT_BRIEFING_FIELDS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createBriefing(client: SupabaseClient, userId: string, input: CreateBriefingInput) {
  const payload = createBriefingSchema.parse(input);
  const { data, error } = await client
    .from("briefings")
    .insert({ ...payload, status: payload.status ?? "draft", created_by: userId })
    .select(SELECT_BRIEFING_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

export async function countBriefingsByOrg(client: SupabaseClient, orgId: string) {
  const { count, error } = await client
    .from("briefings")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (error) throw error;
  return Number(count ?? 0);
}

export async function getBriefingById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from("briefings")
    .select(SELECT_BRIEFING_FIELDS)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBriefing(client: SupabaseClient, id: string, patch: UpdateBriefingInput) {
  const payload = updateBriefingSchema.parse(patch);
  const { data, error } = await client
    .from("briefings")
    .update(payload)
    .eq("id", id)
    .select(SELECT_BRIEFING_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBriefing(client: SupabaseClient, id: string) {
  const { error } = await client.from("briefings").delete().eq("id", id);
  if (error) throw error;
}

export async function syncBriefingSharedState(client: SupabaseClient, briefingId: string) {
  const { count, error: countError } = await client
    .from("public_links")
    .select("id", { count: "exact", head: true })
    .eq("briefing_id", briefingId)
    .is("revoked_at", null)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (countError) throw countError;

  const { error: updateError } = await client
    .from("briefings")
    .update({ shared: Number(count ?? 0) > 0 })
    .eq("id", briefingId);

  if (updateError) throw updateError;
}
