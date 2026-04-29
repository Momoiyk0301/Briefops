import { SupabaseClient } from "@supabase/supabase-js";

const SELECT_BRIEFING_EXPORT_FIELDS =
  "id, workspace_id, briefing_id, version, file_path, status, error_message, created_at, created_by";

export async function getNextBriefingExportVersion(client: SupabaseClient, briefingId: string) {
  const { data, error } = await client
    .from("briefing_exports")
    .select("version")
    .eq("briefing_id", briefingId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return Number(data?.version ?? 0) + 1;
}

export async function createBriefingExport(
  client: SupabaseClient,
  input: {
    workspace_id: string;
    briefing_id: string;
    version: number;
    file_path: string;
    status?: "creating" | "generating" | "ready" | "failed";
    error_message?: string | null;
    created_by: string;
  }
) {
  const { data, error } = await client
    .from("briefing_exports")
    .insert(input)
    .select(SELECT_BRIEFING_EXPORT_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

export async function updateBriefingExport(
  client: SupabaseClient,
  exportId: string,
  patch: {
    file_path?: string;
    status?: "creating" | "generating" | "ready" | "failed";
    error_message?: string | null;
  }
) {
  const { data, error } = await client
    .from("briefing_exports")
    .update(patch)
    .eq("id", exportId)
    .select(SELECT_BRIEFING_EXPORT_FIELDS)
    .single();

  if (error) throw error;
  return data;
}

export async function listBriefingExportsByWorkspace(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client
    .from("briefing_exports")
    .select(`${SELECT_BRIEFING_EXPORT_FIELDS}, briefings!inner(title, event_date, location_text)`)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBriefingExportById(client: SupabaseClient, exportId: string) {
  const { data, error } = await client
    .from("briefing_exports")
    .select(`${SELECT_BRIEFING_EXPORT_FIELDS}, briefings!inner(id, workspace_id, title, event_date)`)
    .eq("id", exportId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
