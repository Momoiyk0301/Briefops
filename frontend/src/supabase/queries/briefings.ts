import { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const createBriefingSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(1),
  event_date: z.string().date().optional(),
  location_text: z.string().optional()
});

const updateBriefingSchema = z.object({
  title: z.string().min(1).optional(),
  event_date: z.string().date().nullable().optional(),
  location_text: z.string().nullable().optional()
});

export type CreateBriefingInput = z.infer<typeof createBriefingSchema>;
export type UpdateBriefingInput = z.infer<typeof updateBriefingSchema>;

export async function listBriefings(client: SupabaseClient) {
  const { data, error } = await client
    .from("briefings")
    .select("id, workspace_id, title, event_date, location_text, pdf_path, created_by, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createBriefing(client: SupabaseClient, userId: string, input: CreateBriefingInput) {
  const payload = createBriefingSchema.parse(input);
  const { data, error } = await client
    .from("briefings")
    .insert({ ...payload, created_by: userId })
    .select("id, workspace_id, title, event_date, location_text, pdf_path, created_by, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function countBriefingsByWorkspace(client: SupabaseClient, workspaceId: string) {
  const { count, error } = await client
    .from("briefings")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return Number(count ?? 0);
}

export async function getBriefingById(client: SupabaseClient, id: string) {
  const { data, error } = await client
    .from("briefings")
    .select("id, workspace_id, title, event_date, location_text, pdf_path, created_by, created_at, updated_at")
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
    .select("id, workspace_id, title, event_date, location_text, pdf_path, created_by, created_at, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBriefing(client: SupabaseClient, id: string) {
  const { error } = await client.from("briefings").delete().eq("id", id);
  if (error) throw error;
}
